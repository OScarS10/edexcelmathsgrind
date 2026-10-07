"""Standalone SymPy equivalence service for runtime answer checking.

Run locally:
    pip install -r python/requirements.txt
    python python/verify_service.py           # listens on :5399

Then point the app at it:
    set SYMPY_VERIFY_URL=http://localhost:5399/verify
    npm run dev

Deploy it anywhere (container, small VM, a second Vercel Python project);
the app only needs the env var. On any timeout or error the app falls back
to its mathjs checker, so this service is optional acceleration, not a
dependency.
"""

import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer

from sympy import Float, simplify, sympify
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

_SPLIT = re.compile(r",|;|\bor\b|\band\b", re.IGNORECASE)


def _clean(expr: str) -> str:
    s = expr.strip().strip("$").strip()
    s = s.replace("\\left", "").replace("\\right", "")
    s = re.sub(r"\\mathrm\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\text\{([^}]*)\}", r"\1", s)
    s = s.replace("\\,", "").replace("\\ ", " ")
    s = re.sub(r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"((\1)/(\2))", s)
    s = re.sub(r"\\sqrt\{([^{}]*)\}", r"sqrt(\1)", s)
    s = re.sub(r"\^\{([^{}]*)\}", r"^(\1)", s)
    s = s.replace("{", "").replace("}", "")
    s = s.replace("^", "**")
    s = s.strip()
    if "=" in s and not re.search(r"[<>]", s):
        # "x = 3" → keep the right-hand side for bare comparisons
        left, right = s.split("=", 1)
        s = right.strip() or left.strip()
    return s


def _to_expr(text: str):
    cleaned = _clean(text)
    if not cleaned:
        return None
    try:
        return parse_expr(cleaned, transformations=TRANSFORMATIONS, evaluate=True)
    except Exception:
        try:
            return sympify(cleaned)
        except Exception:
            return None


def _equivalent(a: str, b: str) -> bool:
    ea, eb = _to_expr(a), _to_expr(b)
    if ea is None or eb is None:
        raise ValueError("unparseable")
    try:
        if simplify(ea - eb) == 0:
            return True
    except Exception:
        pass
    try:
        fa, fb = float(ea), float(eb)
        tol = max(1e-9, abs(fb) * 1e-9)
        return abs(fa - fb) <= tol
    except Exception:
        return False


def equivalent(user: str, answer: str) -> bool:
    u_parts = [p for p in _SPLIT.split(user) if p.strip()]
    a_parts = [p for p in _SPLIT.split(answer) if p.strip()]
    if len(u_parts) > 1 and len(a_parts) > 1:
        if len(u_parts) != len(a_parts):
            return False
        remaining = list(a_parts)
        for u in u_parts:
            hit = next(
                (i for i, a in enumerate(remaining) if _equivalent(u, a)), None
            )
            if hit is None:
                return False
            remaining.pop(hit)
        return True
    return _equivalent(user, answer)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path.rstrip("/") not in ("/verify", ""):
            self.send_response(404)
            self.end_headers()
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            user = str(payload.get("userAnswer", ""))
            answer = str(payload.get("correctAnswer", ""))
            if not user or not answer:
                raise ValueError("missing fields")
            result = {"equivalent": equivalent(user, answer)}
            status = 200
        except ValueError:
            result = {"equivalent": None, "error": "unparseable"}
            status = 200
        except Exception as exc:  # noqa: BLE001 — report, never crash
            result = {"equivalent": None, "error": str(exc)}
            status = 500
        body = json.dumps(result).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):  # quiet
        pass


if __name__ == "__main__":
    port = 5399
    print(f"SymPy verify service on http://localhost:{port}/verify")
    HTTPServer(("127.0.0.1", port), handler).serve_forever()
