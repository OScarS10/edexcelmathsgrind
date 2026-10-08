import { MarkComponent } from "@/types/question";

const M = (note: string): MarkComponent => ({ type: "M", marks: 1, note });
const A = (note: string): MarkComponent => ({ type: "A", marks: 1, note });
const B = (note: string): MarkComponent => ({ type: "B", marks: 1, note });
const DM = (note: string): MarkComponent => ({ type: "dM", marks: 1, note });

/**
 * Hand-written examiner-style mark schemes for the exam-bank seeds, in the
 * shape Edexcel actually uses: method marks (M) awarded on a correct method,
 * dependent method marks (dM) only after the preceding method, independent
 * answer/statement marks (B) for values or statements written down without
 * working, and accuracy marks (A) that depend on a concluded method.
 */
export const HAND_SCHEMES: Record<string, MarkComponent[]> = {
  // ---- Algebra and functions ----
  "eb-001": [
    M("Attempt to factorise a quadratic into two linear factors, e.g. (x ± a)(x ± b)"),
    A("Correct factors: (x + 5)(x − 2)"),
  ],
  "eb-002": [
    M("Valid rearrangement to isolate x, e.g. subtract 4 then divide by 3"),
    A("Correct solution for x"),
  ],
  "eb-003": [
    M("Expand the two brackets, getting at least three correct terms before simplifying"),
    A("All terms correct before simplification"),
    A("Expansion correctly simplified"),
  ],
  "eb-004": [
    M("Apply a correct index law to either the product or the power"),
    M("Combine the index laws into a single power"),
    A("Correct simplified value"),
  ],
  "eb-005": [
    M("Rearrange the equation to the form ax² + bx + c = 0"),
    M("Valid method to solve the quadratic (factorise, complete the square or formula)"),
    A("Both solutions correct"),
  ],
  "eb-006": [
    B("Deal with the coefficient of x² before completing the square"),
    M("Complete the square into the form (x ± p)² ± q"),
    A("Correct completed-square form"),
  ],
  "eb-007": [
    M("Rewrite the modulus equation/inequality as two cases or solve the critical values"),
    M("Solve the resulting linear cases"),
    A("Correct solution set or interval"),
  ],
  "eb-008": [
    M("Use the two points to find the gradient"),
    M("Substitute the gradient and one point into a straight-line equation"),
    A("Equation correctly simplified"),
  ],
  "eb-009": [
    M("Complete the square on x and y, or otherwise identify centre and radius"),
    A("Correct equation of the circle"),
  ],
  "eb-010": [
    M("Identify a and d from the context"),
    M("Substitute into a correct formula for the sum of an arithmetic series"),
    A("Correct value of the sum"),
    A("Final answer in the required units/context"),
  ],
  "eb-011": [
    M("Find the common ratio or identify the terms of the geometric series"),
    M("Substitute into a correct formula for a geometric series (term or sum)"),
    A("Correct value"),
  ],
  "eb-012": [
    B("Write down the common ratio r"),
    M("Use the term formula arⁿ⁻¹ with the given values"),
    A("Correct term for the required n"),
  ],
  "eb-013": [
    M("Use the binomial theorem with the correct exponent"),
    M("Calculate the required binomial coefficients or combinations"),
    A("Expansion correct in unsimplified form"),
    A("Expansion correctly simplified / requested term correct"),
  ],
  "eb-014": [
    M("Make a valid start to the proof (define the variables or state the assumption)"),
    M("Correct algebraic manipulation to a common form"),
    A("Conclusion logically drawn and clearly stated"),
  ],
  "eb-015": [
    B("Base case checked for n = 1 (or n = 0) and stated"),
    M("Assumption written as a clear induction hypothesis P(k)"),
    M("Correct induction step attempted, expressing P(k + 1) in terms of P(k)"),
    A("Algebraic manipulation in the step correct"),
    DM("Use the assumption P(k) within the P(k + 1) argument"),
    A("Conclusion stated: true for base case, and if true for k then true for k + 1, hence true for all"),
  ],
  "eb-016": [
    M("Differentiate each term using the power rule"),
    A("Derivative correct (terms and notation)"),
  ],
  "eb-017": [
    M("Identify the inner function (u) and state the chain-rule set-up"),
    M("Apply dy/dx = dy/du × du/dx"),
    A("Derivative correct in unsimplified form"),
    A("Derivative correctly simplified"),
  ],
  "eb-018": [
    M("Differentiate the function (applying product/quotient/chain rules as needed)"),
    A("Derivative correct"),
    M("Set the derivative to zero to locate stationary points"),
    A("x-coordinates of the stationary points correct"),
    M("Find the corresponding y-coordinates or evaluate a correct test"),
    A("Nature of each stationary point correctly determined"),
  ],
  "eb-019": [
    M("Integrate each term, increasing each power by one"),
    A("Integral correct in unsimplified form"),
    A("Constant of integration + c included"),
  ],
  "eb-020": [
    M("Integrate the integrand correctly"),
    A("Substitute the limits correctly and evaluate the difference"),
    A("Area correct (magnitude with units if asked)"),
  ],
  "eb-021": [
    B("State the trapezium rule formula"),
    M("Use the correct strip width h from the given interval/ordinates"),
    M("Evaluate the sum end-ordinates + 2 × interior ordinates with the correct weighting"),
    A("Numerical value correct"),
    A("Final answer to the stated accuracy"),
  ],
  "eb-022": [
    B("Rearrange f(x) = 0 into a suitable iterative form xₙ₊₁ = g(xₙ)"),
    M("Substitute the starting value into the iteration"),
    A("Iterated value correct to the required accuracy"),
  ],
  "eb-023": [
    M("Combine the logarithms into a single log using a correct log law"),
    M("Exponentiate both sides and solve the resulting equation, discarding invalid roots"),
    A("Solution (or solutions) correct"),
  ],
  "eb-024": [
    B("Apply a log law to at least one term"),
    A("Logarithm correctly combined to a single value"),
  ],
  "eb-025": [
    M("Take logs of both sides (any valid base)"),
    M("Apply the power log law to bring the index down"),
    M("Rearrange the equation for x"),
    A("Exact value in ln form"),
    A("Numerical value to the required accuracy"),
  ],
  // ---- Trigonometry ----
  "eb-026": [
    M("Reduce the equation to a basic form (sinθ = k, cosθ = k or a quadratic in sin/cos)"),
    M("Find all solutions in the given range using the relevant quadrants/cast diagram"),
    A("Complete set of solutions correct"),
  ],
  "eb-027": [
    B("State the trigonometric identity to be used (e.g. tanθ = sinθ/cosθ)"),
    M("Rewrite the expression in terms of a single ratio and manipulate it"),
    A("Expression correctly simplified"),
  ],
  "eb-028": [
    M("Use a Pythagorean identity (sin²θ + cos²θ = 1) to make the expressions comparable"),
    M("Rearrange or factorise to a common form on each side"),
    A("Result proven with the equivalence clearly stated"),
  ],
  "eb-029": [
    M("Expand R sin(θ ± α) and compare coefficients to form equations"),
    A("Value of R correct"),
    A("Value of α correct (in the required units)"),
    M("Solve the reduced equation for θ in the given range"),
    A("Solutions correct"),
  ],
  // ---- Vectors ----
  "eb-030": [
    B("State or use the scalar product rule a·b = a₁b₁ + a₂b₂ + a₃b₃"),
    M("Multiply corresponding components and collect the products"),
    A("Scalar product correct"),
  ],
  // ---- Statistics ----
  "eb-031": [
    M("Use a correct expression for the mean from Σx and n"),
    A("Mean correct"),
    M("Substitute into a correct variance/standard deviation formula"),
    A("Standard deviation correct (to the stated accuracy)"),
  ],
  "eb-032": [
    M("Identify the positions of the lower and upper quartiles from the data/list"),
    M("Read or interpolate Q₁ and Q₃"),
    A("Interquartile range correct"),
  ],
  "eb-033": [
    M("State a correct rule connecting the given probabilities (e.g. P(A∪B) = P(A) + P(B) − P(A∩B))"),
    A("Required probabilities substituted correctly"),
    A("Intermediate probability correct"),
    A("Final probability found and simplified for what the question asks"),
  ],
  "eb-034": [
    M("Multiply conditional probabilities along the appropriate branches, adjusting denominators for sampling without replacement"),
    A("Sum of the required products correct"),
    A("Final probability simplified to the required accuracy"),
  ],
  "eb-035": [
    M("State the model X ~ B(n, p) with the correct parameters from the context"),
    M("Use a correct binomial probability formula or table for the required event"),
    A("Values substituted correctly"),
    A("Probability correct to the stated accuracy"),
  ],
  "eb-036": [
    M("Standardise using z = (x − μ)/σ, or write the correct tail symmetry set-up"),
    M("Use the standard normal table/symmetry correctly for the required region"),
    A("Probability correct to the stated accuracy"),
  ],
  "eb-037": [
    B("Null hypothesis H₀ correctly stated in context"),
    B("Alternative hypothesis and test model correctly stated (e.g. X ~ B(n, p) with the correct p)"),
    A("Conclusion correctly written in context based on the test"),
  ],
  "eb-038": [
    M("Use the ratio (stratum size ÷ total) × sample size"),
    A("Correct number, rounded to the required accuracy"),
  ],
  // ---- Mechanics ----
  "eb-039": [
    M("Select a correct suvat equation for the situation"),
    M("Substitute the given values into the equation"),
    A("Intermediate calculation correct"),
    A("Final velocity/displacement (or time) correct with units"),
  ],
  "eb-040": [
    B("Resolve the initial velocity into horizontal and vertical components with correct trigonometry"),
    M("Write a correct vertical or horizontal equation of motion"),
    M("Substitute the required values into the equation"),
    DM("Solve the resulting equation or simultaneous equations for the required quantity"),
    A("Final answer correct with units"),
  ],
  "eb-041": [
    M("Apply Newton's second law, F = ma, to the forces present (resultant force correct)"),
    A("Acceleration (or mass) correct, with direction/units as asked"),
  ],
  "eb-042": [
    M("Resolve perpendicular to the plane to find the normal reaction R"),
    M("Use F = μR with the friction in the correct direction (limiting friction)"),
    A("Required force or acceleration correct with units"),
  ],
  "eb-043": [
    M("Write a correct equation of motion for each particle/body"),
    M("Relate the two equations correctly (equal tension or equal acceleration constraint)"),
    M("Solve the resulting system to eliminate the tension"),
    A("Acceleration correct with units"),
    A("Tension (or other required quantity) correct with units"),
  ],
  "eb-044": [
    M("Take moments about a chosen point to form a correct equation"),
    A("Equation correct with signs and perpendicular distances"),
    M("Solve for the required force or distance (or use an equilibrium check)"),
    A("Final answer correct with units"),
  ],
  "eb-045": [
    M("Take logs of both sides and bring the index down"),
    A("Solution for x correct (exact or to the stated accuracy)"),
  ],
  "eb-046": [
    M("Write the line in component/parametric form"),
    M("Substitute into the plane equation and simplify"),
    A("Correct value of t (t = 2)"),
    M("Substitute t back into the line equation"),
    A("Point (5, 0, 5) correct"),
  ],
  "eb-047": [
    M("Set up the scalar product p · q = 0 with the unknown m"),
    M("Solve the resulting linear equation for m"),
    M("Substitute m into the magnitude formula √(4 + m² + 1)"),
    A("Magnitude |p| = 9/4 correct"),
  ],
  "eb-048": [
    M("Take moments about A: reaction × distance on one side, weights × distances on the other"),
    M("Substitute the distances correctly: 5R_S = 600 × 3 + 300 × 2"),
    A("R_S = 480 N correct"),
    M("Balance vertical forces: R_A + R_S = total weight"),
    A("R_A = 420 N correct"),
  ],
  "eb-049": [
    M("Find the moment of the 3 kg mass (3g × 0.5, g cancels)"),
    M("Set up the balance equation 1.5g = 2gd"),
    M("Solve for d"),
    A("d = 0.75 m correct"),
  ],
  "eb-050": [
    B("Assumption stated: √2 = a/b with a, b integers in lowest terms, b ≠ 0"),
    M("Square and rearrange to 2b² = a²"),
    M("Deduce a is even (a² even ⇒ a even) and write a = 2k"),
    A("Substitute to get b² = 2k², so b is even"),
    DM("Both even contradicts lowest terms — the contradiction is drawn explicitly"),
    A("Conclusion: assumption false, hence √2 is irrational"),
  ],
  "eb-051": [
    B("Factorises n³ − n as (n − 1)n(n + 1)"),
    M("Recognises these as three consecutive integers"),
    A("States that one of any three consecutive integers is divisible by 3"),
    A("Conclusion for all integers n ≥ 1"),
  ],
  "eb-052": [
    B("Initial mass 100 g from t = 0"),
    M("Set up 100 × 2^(t/5) = 800 and reduce to 2^(t/5) = 8"),
    M("Write 8 as 2³ and take logs / equate exponents"),
    A("t/5 = 3"),
    A("t = 15 minutes"),
  ],
  "eb-053": [
    M("Solve 4x − x² = x to find the intersections"),
    A("Limits 0 and 3 correct"),
    M("Set up the integral of (upper − lower) between the limits"),
    M("Integrate correctly to [3x²/2 − x³/3]"),
    A("Evaluate the definite integral"),
    A("Area 9/2 correct"),
  ],
  // ---- Large Data Set ----
  "lds-001": [
    M("Apply stratified sampling ratio to the Large Data Set context"),
    M("Use the correct group size from the given data"),
    A("Correct number, rounded to the required accuracy"),
  ],
  "lds-002": [
    M("Identify the class interval containing the median and its cumulative frequency"),
    M("Set up linear interpolation on the median class"),
    A("Substitution into the interpolation correct"),
    A("Estimated median correct to the required accuracy"),
  ],
  "lds-003": [
    M("Write the conditional probability as a fraction of a relevant total from the table"),
    A("Probability correct"),
  ],
  "lds-004": [
    M("State the model X ~ B(n, p) with parameters taken from the context"),
    M("Set up the required tail probability, using 1 − P(X ≤ k − 1) or tables as appropriate"),
    A("Probability correct to the stated accuracy"),
  ],
  "lds-005": [
    M("Standardise the normal variable or write the correct tail set-up"),
    M("Use symmetry and the standard normal table correctly"),
    A("Probability (or threshold) correct to the stated accuracy"),
  ],
  "lds-006": [
    B("Hypotheses correctly stated in context with the correct model parameter"),
    B("Correct model under H₀ stated (e.g. X ~ B(n, 0.5))"),
    M("Test statistic or p-value calculated correctly"),
    A("Conclusion in context: reject/fail to reject H₀ at the stated significance level"),
  ],
  "lds-007": [
    M("Use class midpoints 5, 15, 25, 35 for each group"),
    M("Multiply each midpoint by its frequency and total: 935"),
    M("Divide by the total frequency 55"),
    A("Estimated mean 17 minutes correct"),
  ],
  "lds-008": [
    M("Find the Year 13 total (45 + 105 = 150) — the conditional denominator"),
    M("Set up P(train | Year 13) = 105/150"),
    A("Probability 0.7 correct"),
  ],
};