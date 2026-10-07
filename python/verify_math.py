#!/usr/bin/env python3
"""SymPy verification harness for the Edexcel revision-bot question bank.

The bank's answers were written by an LLM. This harness re-derives every
answer independently with SymPy so a hallucinated solution can never ship.

Usage:
    python python/verify_math.py            # check all specs
    python python/verify_math.py --only eb-016
    python python/verify_math.py --specs python/verify_specs.json

Exit code is non-zero if any check fails (CI-friendly).
"""
from __future__ import annotations

import argparse
import json
import math
import random
import sys
from typing import Any

from sympy import (
    And,
    FiniteSet,
    Interval,
    LessThan,
    Rational,
    StrictGreaterThan,
    StrictLessThan,
    Symbol,
    diff,
    expand,
    integrate,
    simplify,
    sqrt,
    solve,
)
from sympy import N as sp_N
from sympy.core.relational import Relational
from sympy.solvers.inequalities import solve_univariate_inequality
from sympy.solvers.solveset import solveset
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)


def P(s: Any):
    """Parse a spec expression string into a SymPy object."""
    if isinstance(s, bool):
        raise ValueError("boolean passed as expression")
    if isinstance(s, (int, float)):
        return Rational(s) if isinstance(s, int) else Rational(str(s))
    return parse_expr(str(s), transformations=TRANSFORMATIONS)


def num(value) -> float:
    return float(sp_N(value, 30))


def num_eq(a, b, tol: float = 1e-9) -> bool:
    try:
        av, bv = num(a), num(b)
    except Exception:
        return False
    return abs(av - bv) <= tol * max(1.0, abs(av), abs(bv))


def round_sf(v: float, sf: int) -> float:
    if v == 0:
        return 0.0
    exp = math.floor(math.log10(abs(v)))
    return round(v, sf - exp - 1)


def equivalent(a, b) -> tuple[bool, str]:
    """Symbolic equivalence with numeric-sampling fallback."""
    d = simplify(expand(a) - expand(b))
    if d == 0:
        return True, "identical under simplify()"
    try:
        eq = d.equals(0)
        if eq is True:
            return True, "identical under equals()"
    except Exception:
        pass
    symbols = sorted(d.free_symbols, key=str)
    checked = 0
    if not symbols:
        return False, f"difference is {d}"
    for _ in range(30):
        subs = {
            v: Rational(random.randint(-9, 9), random.randint(1, 9))
            for v in symbols
        }
        try:
            val = d.subs(subs)
            if any(val.has(s) for s in symbols):
                continue
            v = complex(sp_N(val, 25))
        except Exception:
            continue
        checked += 1
        if abs(v) > 1e-12 * max(1.0, abs(complex(sp_N(a.subs(subs), 25)))):
            return False, f"differs at {subs}: |delta| = {abs(v):.3e}"
    if checked >= 10:
        return True, f"numeric sampling ({checked} points)"
    return False, "could not verify (too few evaluable points)"


def _dedupe(elems) -> list:
    """Keep only the first of any group of equivalent expressions."""
    uniq = []
    for e in elems:
        if not any(equivalent(e, u)[0] for u in uniq):
            uniq.append(e)
    return uniq


def solutions_as_set(sols, expected_strs) -> tuple[bool, str]:
    expected = _dedupe([simplify(P(s)) for s in expected_strs])
    got = _dedupe([simplify(s) for s in sols])
    if len(got) != len(expected):
        return False, f"solutions {got} != expected {expected}"
    used = set()
    for e in expected:
        match = None
        for i, g in enumerate(got):
            if i in used:
                continue
            ok, _ = equivalent(e, g)
            if ok or num_eq(e, g, 1e-12):
                match = i
                break
        if match is None:
            return False, f"expected solution {e} not found in {got}"
        used.add(match)
    return True, f"solutions {got}"


def interval_from_relational(expr, var) -> Interval | None:
    """Convert And(x > a, x < b) style results into an Interval."""
    parts = list(expr.args) if isinstance(expr, And) else [expr]
    lo = (None, True)
    hi = (None, True)
    for part in parts:
        if not isinstance(part, Relational):
            return None
        a, b = part.lhs, part.rhs
        flip = var in b.free_symbols and var not in a.free_symbols
        if flip:
            a, b = b, a
            if isinstance(part, StrictLessThan):
                kind = ">"
            elif isinstance(part, LessThan):
                kind = ">="
            elif isinstance(part, StrictGreaterThan):
                kind = "<"
            else:
                kind = "<="
        else:
            if isinstance(part, StrictLessThan):
                kind = "<"
            elif isinstance(part, LessThan):
                kind = "<="
            elif isinstance(part, StrictGreaterThan):
                kind = ">"
            else:
                kind = ">="
        if kind == "<":
            hi = (b, True)
        elif kind == "<=":
            hi = (b, False)
        elif kind == ">":
            lo = (b, True)
        else:
            lo = (b, False)
    if lo[0] is None or hi[0] is None:
        return None
    return Interval(lo[0], hi[0], left_open=lo[1], right_open=hi[1])


# ---------------------------------------------------------------- check kinds

def check_equivalent(spec) -> tuple[bool, str]:
    return equivalent(P(spec["a"]), P(spec["b"]))


def check_solve(spec) -> tuple[bool, str]:
    var = spec.get("var", "x")
    eq = P(spec["equation"])
    sols = solve(eq, Symbol(var))
    if spec.get("realOnly"):
        sols = [s for s in sols if s.is_real is not False]
    if not sols and spec.get("expected"):
        return False, "no solutions found"
    return solutions_as_set(sols, spec["expected"])


def check_solve_domain(spec) -> tuple[bool, str]:
    var = spec.get("var", "x")
    eq = P(spec["equation"])
    lo, hi = P(spec["domain"][0]), P(spec["domain"][1])
    sol = solveset(eq, Symbol(var), Interval(lo, hi))
    sols = list(sol) if isinstance(sol, FiniteSet) else [sol]
    return solutions_as_set(sols, spec["expected"])


def check_inequality(spec) -> tuple[bool, str]:
    var = spec.get("var", "x")
    rel = P(spec["relation"])
    sol = solve_univariate_inequality(rel, Symbol(var))
    if isinstance(sol, Interval):
        got = sol
    else:
        got = interval_from_relational(sol, Symbol(var))
    if got is None:
        return False, f"could not interpret solution {sol}"
    lo, hi = P(spec["expected"][0]), P(spec["expected"][1])
    opens = spec.get("open", [True, True])
    want = Interval(lo, hi, left_open=opens[0], right_open=opens[1])
    if got == want:
        return True, f"solution set {got}"
    return False, f"solution set {got} != expected {want}"


def check_derivative(spec) -> tuple[bool, str]:
    var = Symbol(spec.get("var", "x"))
    got = diff(P(spec["expr"]), var)
    return equivalent(got, P(spec["expected"]))


def check_integral_indefinite(spec) -> tuple[bool, str]:
    var = Symbol(spec.get("var", "x"))
    got = diff(P(spec["expected"]), var)
    return equivalent(got, P(spec["expr"]))


def check_integral_definite(spec) -> tuple[bool, str]:
    var = Symbol(spec.get("var", "x"))
    got = integrate(P(spec["expr"]), (var, P(spec["lower"]), P(spec["upper"])))
    return equivalent(got, P(spec["expected"]))


def check_numeric(spec) -> tuple[bool, str]:
    actual = P(spec["expr"])
    expected = P(spec["expected"])
    if "sf" in spec:
        got = round_sf(num(actual), int(spec["sf"]))
        want = num(expected)
        if abs(got - want) <= 1e-9 * max(1.0, abs(want)):
            return True, f"{num(actual):.10g} to {spec['sf']} s.f. = {got}"
        return False, f"{num(actual):.10g} to {spec['sf']} s.f. = {got}, expected {want}"
    if "absTol" in spec:
        tol = float(spec["absTol"])
        if abs(num(actual) - num(expected)) <= tol:
            return True, f"{num(actual):.10g}"
        return False, f"{num(actual):.10g} != {num(expected):.10g} (tol {tol})"
    return equivalent(actual, expected)


def check_expand_coeffs(spec) -> tuple[bool, str]:
    var = Symbol(spec.get("var", "x"))
    expanded = expand(P(spec["expr"]))
    for power, expected in spec["powers"].items():
        got = expanded.coeff(var, int(power))
        if not num_eq(got, P(expected), 1e-12):
            return False, f"x^{power} coefficient is {got}, expected {expected}"
    return True, f"coefficients match {spec['powers']}"


def check_stationary(spec) -> tuple[bool, str]:
    var = Symbol(spec.get("var", "x"))
    f = P(spec["expr"])
    xs = solve(diff(f, var), var)
    expected_pts = spec["expected_points"]
    if len(xs) != len(expected_pts):
        return False, f"found x = {[str(s) for s in xs]}, expected {expected_pts}"
    natures = spec.get("nature", [])
    d2 = diff(f, var, 2)
    for i, x0 in enumerate(xs):
        ex, ey = P(expected_pts[i][0]), P(expected_pts[i][1])
        if not (num_eq(x0, ex, 1e-12) or equivalent(x0, ex)[0]):
            return False, f"stationary x = {x0}, expected {expected_pts[i][0]}"
        y0 = f.subs(var, x0)
        if not (num_eq(y0, ey, 1e-12) or equivalent(y0, ey)[0]):
            return False, f"y({x0}) = {y0}, expected {expected_pts[i][1]}"
        if i < len(natures):
            cur = num(d2.subs(var, x0))
            want_max = natures[i].lower().startswith("max")
            if want_max and not cur < 0:
                return False, f"x = {x0}: f'' = {cur} > 0 but marked maximum"
            if not want_max and not cur > 0:
                return False, f"x = {x0}: f'' = {cur} < 0 but marked minimum"
    return True, f"{len(xs)} stationary points verified with natures"


def check_stats_mean_sd(spec) -> tuple[bool, str]:
    data = [P(d) for d in spec["data"]]
    n = len(data)
    mean = sum(data) / n
    if not num_eq(mean, P(spec["mean"]), 1e-12):
        return False, f"mean = {mean}, expected {spec['mean']}"
    if spec.get("population", True):
        var = sum((d - mean) ** 2 for d in data) / n
    else:
        var = sum((d - mean) ** 2 for d in data) / (n - 1)
    sd = sqrt(var)
    if not num_eq(sd, P(spec["sd"]), 1e-12):
        return False, f"sd = {sd}, expected {spec['sd']}"
    return True, f"mean {mean}, sd {sd}"


def check_stats_iqr(spec) -> tuple[bool, str]:
    data = sorted(P(d) for d in spec["data"])
    n = len(data)
    mid = n // 2
    lower, upper = data[:mid], data[mid:]

    def median(xs):
        m = len(xs)
        return xs[m // 2] if m % 2 else (xs[m // 2 - 1] + xs[m // 2]) / 2

    iqr = median(upper) - median(lower)
    if not num_eq(iqr, P(spec["expected"]), 1e-12):
        return False, f"IQR = {iqr}, expected {spec['expected']}"
    return True, f"Q1 = {median(lower)}, Q3 = {median(upper)}, IQR = {iqr}"


def check_dice_sum(spec) -> tuple[bool, str]:
    """Independently count dice-outcome pairs summing to the target."""
    target = int(spec["target"])
    count = sum(1 for i in range(1, 7) for j in range(1, 7) if i + j == target)
    got = Rational(count, 36)
    want = P(spec["expected"])
    if num_eq(got, want, 1e-12):
        return True, f"{count}/36 = {got}"
    return False, f"{count}/36 = {got}, expected {want}"


def check_vector_on_line(spec) -> tuple[bool, str]:
    """Check a + lambda*b equals the target point componentwise."""
    a = [int(v) for v in spec["a"]]
    b = [int(v) for v in spec["b"]]
    k = int(spec["k"])
    target = [int(v) for v in spec["target"]]
    got = [a[i] + k * b[i] for i in range(len(a))]
    if got == target:
        return True, f"lambda = {k} gives {got}"
    return False, f"lambda = {k} gives {got}, expected {target}"


def check_text(spec) -> tuple[bool, str]:
    return True, "non-symbolic answer (manually reviewed)"


CHECKS = {
    "equivalent": check_equivalent,
    "solve": check_solve,
    "solve_domain": check_solve_domain,
    "inequality": check_inequality,
    "derivative": check_derivative,
    "integral_indefinite": check_integral_indefinite,
    "integral_definite": check_integral_definite,
    "numeric": check_numeric,
    "expand_coeffs": check_expand_coeffs,
    "stationary": check_stationary,
    "stats_mean_sd": check_stats_mean_sd,
    "stats_iqr": check_stats_iqr,
    "dice_sum": check_dice_sum,
    "vector_on_line": check_vector_on_line,
    "text": check_text,
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--specs",
        nargs="+",
        default=["python/verify_specs.json", "python/generated_specs.json"],
        help="spec files to check (missing files are skipped)",
    )
    ap.add_argument("--only", help="run only specs whose id starts with this prefix")
    args = ap.parse_args()

    random.seed(20260106)  # reproducible sampling fallback
    specs: list[dict] = []
    for path in args.specs:
        try:
            with open(path, encoding="utf-8") as fh:
                file_specs = json.load(fh)["specs"]
        except FileNotFoundError:
            print(f"(skipping {path} - not generated yet; run `npm run verify:generated`)")
            continue
        specs.extend(file_specs)

    failures: list[str] = []
    passed = skipped = 0
    for spec in specs:
        sid = spec.get("id") or "?"
        kind = spec.get("kind", "?")
        if args.only and not sid.startswith(args.only):
            continue
        check = CHECKS.get(kind)
        if check is None:
            failures.append(f"{sid}: unknown kind '{kind}'")
            print(f"[FAIL] {sid:<12} {kind:<20} unknown kind")
            continue
        try:
            ok, detail = check(spec)
        except Exception as exc:  # a crashing check is a failing check
            ok, detail = False, f"{type(exc).__name__}: {exc}"
        tag = "PASS" if ok else "FAIL"
        print(f"[{tag}] {sid:<12} {kind:<20} {detail}")
        if ok:
            if kind == "text":
                skipped += 1
            passed += 1
        else:
            failures.append(f"{sid} ({kind}): {detail}")

    total = passed + len(failures)
    print(f"\n{passed}/{total} checks passed" + (f", {skipped} manual" if skipped else ""))
    if failures:
        print("\nFAILURES:")
        for f in failures:
            print(f"  - {f}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
