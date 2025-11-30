import { Expr } from "../../lab04";

type BinaryOperator = 'add' | 'sub' | 'mul' | 'div';

type BinaryExpr = Extract<Expr, { type: 'binary' }>;

type NegateExpr = Extract<Expr, { type: 'negate' }>;

type Factors = string[];

interface PolynomialTerm {
    coeff: number;
    factors: Factors;
    displayFactors: Factors;
}

type Polynomial = Map<string, PolynomialTerm>;

const number = (value: number): Expr => ({ type: "number", value });

const binary = (op: BinaryOperator, left: Expr, right: Expr): Expr => {
    switch (op) {
        case "add":
            if (isZero(left)) return right;
            if (isZero(right)) return left;
            if (left.type === "number" && right.type === "number") {
                return number(left.value + right.value);
            }
            break;
        case "sub":
            if (isZero(right)) return left;
            if (isZero(left)) return negate(right);
            if (left.type === "number" && right.type === "number") {
                return number(left.value - right.value);
            }
            break;
        case "mul":
            if (isZero(left) || isZero(right)) {
                return number(0);
            }
            if (isOne(left)) return right;
            if (isOne(right)) return left;
            if (left.type === "number" && right.type === "number") {
                return number(left.value * right.value);
            }
            break;
        case "div":
            if (isZero(left)) return number(0);
            if (isOne(right)) return left;
            if (left.type === "number" && right.type === "number" && right.value !== 0) {
                return number(left.value / right.value);
            }
            break;
    }
    return {
        type: "binary",
        op,
        left,
        right,
    } as BinaryExpr;
};

const negate = (expr: Expr): Expr => {
    if (isZero(expr)) {
        return number(0);
    }
    if (expr.type === "number") {
        return number(-expr.value);
    }
    if (expr.type === "binary" && expr.op === "div" && expr.left.type === "number") {
        return div(number(-expr.left.value), expr.right);
    }
    if (expr.type === "negate") {
        return expr.operand;
    }
    return { type: "negate", operand: expr } as NegateExpr;
};

const add = (left: Expr, right: Expr): Expr => binary("add", left, right);
const sub = (left: Expr, right: Expr): Expr => binary("sub", left, right);
const mul = (left: Expr, right: Expr): Expr => binary("mul", left, right);
const div = (left: Expr, right: Expr): Expr => binary("div", left, right);

export function derive(e: Expr, varName: string): Expr {
    const derived = deriveNode(e, varName);
    return expandAndCollect(derived);
}

function deriveNode(e: Expr, varName: string): Expr {
    switch (e.type) {
        case "number":
            return number(0);
        case "variable":
            return e.name === varName ? number(1) : number(0);
        case "negate":
            return negate(deriveNode(e.operand, varName));
        case "binary":
            return deriveBinary(e, varName);
    }
}

function deriveBinary(node: BinaryExpr, varName: string): Expr {
    const { op, left, right } = node;
    switch (op) {
        case "add":
            return add(deriveNode(left, varName), deriveNode(right, varName));
        case "sub":
            return sub(deriveNode(left, varName), deriveNode(right, varName));
        case "mul": {
            const leftPrime = deriveNode(left, varName);
            const rightPrime = deriveNode(right, varName);
            return add(mul(leftPrime, right), mul(left, rightPrime));
        }
        case "div": {
            const leftPrime = deriveNode(left, varName);
            const rightPrime = deriveNode(right, varName);
            const numerator = sub(mul(leftPrime, right), mul(left, rightPrime));
            const denominator = mul(right, right);
            return div(numerator, denominator);
        }
    }
    throw new Error(`Unsupported operator: ${op}`);
}

function isZero(e: Expr): boolean {
    return e.type === "number" && e.value === 0;
}

function isOne(e: Expr): boolean {
    return e.type === "number" && e.value === 1;
}

function expandAndCollect(expr: Expr): Expr {
    // Recursively simplify the AST and collapse polynomial fragments so
    // that the final result has expanded factors with like terms collected.
    const simplified = (() => {
        switch (expr.type) {
            case "number":
            case "variable":
                return expr;
            case "negate":
                return negate(expandAndCollect(expr.operand));
            case "binary":
                return binary(expr.op, expandAndCollect(expr.left), expandAndCollect(expr.right));
        }
    })();
    const polynomial = exprToPolynomial(simplified);
    if (polynomial) {
        return polynomialToExpr(polynomial);
    }
    return simplified;
}

function exprToPolynomial(expr: Expr): Polynomial | null {
    // Try to represent the given expression as a polynomial (no division).
    switch (expr.type) {
        case "number":
            return numberToPolynomial(expr.value);
        case "variable":
            return variableToPolynomial(expr.name);
        case "negate": {
            const operand = exprToPolynomial(expr.operand);
            return operand ? scalePolynomial(operand, -1) : null;
        }
        case "binary": {
            if (expr.op === "div") {
                return null;
            }
            const left = exprToPolynomial(expr.left);
            const right = exprToPolynomial(expr.right);
            if (!left || !right) {
                return null;
            }
            switch (expr.op) {
                case "add":
                    return addPolynomials(left, right);
                case "sub":
                    return addPolynomials(left, scalePolynomial(right, -1));
                case "mul":
                    return multiplyPolynomials(left, right);
            }
        }
    }
    return null;
}

function numberToPolynomial(value: number): Polynomial {
    const poly: Polynomial = new Map();
    if (value !== 0) {
        addPolynomialTerm(poly, value, [], [], true);
    }
    return poly;
}

function variableToPolynomial(name: string): Polynomial {
    const poly: Polynomial = new Map();
    addPolynomialTerm(poly, 1, [name], [name], true);
    return poly;
}

function addPolynomials(left: Polynomial, right: Polynomial): Polynomial {
    const result: Polynomial = new Map();
    for (const term of left.values()) {
        addPolynomialTerm(result, term.coeff, term.factors, term.displayFactors, true);
    }
    for (const term of right.values()) {
        addPolynomialTerm(result, term.coeff, term.factors, term.displayFactors, true);
    }
    return result;
}

function scalePolynomial(poly: Polynomial, factor: number): Polynomial {
    const result: Polynomial = new Map();
    if (factor === 0) {
        return result;
    }
    for (const term of poly.values()) {
        addPolynomialTerm(result, term.coeff * factor, term.factors, term.displayFactors, true);
    }
    return result;
}

function multiplyPolynomials(left: Polynomial, right: Polynomial): Polynomial {
    const result: Polynomial = new Map();
    if (left.size === 0 || right.size === 0) {
        return result;
    }
    for (const l of left.values()) {
        for (const r of right.values()) {
            const combinedFactors = l.factors.concat(r.factors);
            const displayFactors = l.displayFactors.concat(r.displayFactors);
            addPolynomialTerm(result, l.coeff * r.coeff, combinedFactors, displayFactors);
        }
    }
    return result;
}

function addPolynomialTerm(
    result: Polynomial,
    coeff: number,
    factors: Factors,
    displayFactors: Factors,
    alreadySorted = false,
): void {
    if (coeff === 0) {
        return;
    }
    const normalized = alreadySorted ? factors.slice() : sortFactors(factors);
    const display = displayFactors.slice();
    const key = normalized.join("*");
    const existing = result.get(key);
    if (existing) {
        const next = existing.coeff + coeff;
        if (next === 0) {
            result.delete(key);
        } else {
            existing.coeff = next;
        }
    } else {
        result.set(key, { coeff, factors: normalized, displayFactors: display });
    }
}

function sortFactors(factors: Factors): Factors {
    if (factors.length <= 1) {
        return factors.slice();
    }
    return [...factors].sort((a, b) => a.localeCompare(b));
}

function polynomialToExpr(poly: Polynomial): Expr {
    const terms = Array.from(poly.values()).filter(term => term.coeff !== 0);
    if (terms.length === 0) {
        return number(0);
    }
    terms.sort(compareTerms);
    let result = buildLeadingTerm(terms[0]);
    for (let i = 1; i < terms.length; i++) {
        const term = terms[i];
        const magnitude = Math.abs(term.coeff);
        const magnitudeExpr = buildPositiveTerm(magnitude, term.displayFactors);
        result = term.coeff >= 0 ? add(result, magnitudeExpr) : sub(result, magnitudeExpr);
    }
    return result;
}

function compareTerms(a: PolynomialTerm, b: PolynomialTerm): number {
    const aConst = a.factors.length === 0;
    const bConst = b.factors.length === 0;
    if (aConst && !bConst) return -1;
    if (!aConst && bConst) return 1;
    if (a.factors.length !== b.factors.length) {
        return a.factors.length - b.factors.length;
    }
    const keyA = a.factors.join("*");
    const keyB = b.factors.join("*");
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    if (a.coeff === b.coeff) return 0;
    return a.coeff < b.coeff ? -1 : 1;
}

function buildLeadingTerm(term: PolynomialTerm): Expr {
    if (term.coeff >= 0) {
        return buildPositiveTerm(term.coeff, term.displayFactors);
    }
    const positive = buildPositiveTerm(Math.abs(term.coeff), term.displayFactors);
    return negate(positive);
}

function buildPositiveTerm(coeff: number, orderedFactors: Factors): Expr {
    let expr: Expr | null = null;
    if (coeff !== 1 || orderedFactors.length === 0) {
        expr = number(coeff);
    }
    for (const factor of orderedFactors) {
        const factorExpr: Expr = { type: "variable", name: factor };
        expr = expr ? mul(expr, factorExpr) : factorExpr;
    }
    return expr ?? number(1);
}
