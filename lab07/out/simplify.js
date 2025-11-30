"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplify = simplify;
const cost_1 = require("./cost");
function simplify(expr, identities) {
    const rewrites = buildRewrites(identities);
    const queue = [expr];
    const visited = new Set([exprKey(expr)]);
    const initialCost = (0, cost_1.cost)(expr);
    const allowance = Math.max(6, Math.floor(initialCost / 2)); // allow limited temporary growth
    const costLimit = initialCost + allowance;
    let bestExpr = expr;
    let bestCost = initialCost;
    while (queue.length > 0) {
        const current = queue.shift();
        const currentCost = (0, cost_1.cost)(current);
        if (currentCost < bestCost) {
            bestCost = currentCost;
            bestExpr = current;
        }
        for (const next of produceNeighbours(current, rewrites)) {
            const key = exprKey(next);
            if (visited.has(key)) {
                continue;
            }
            const nextCost = (0, cost_1.cost)(next);
            if (nextCost > costLimit) {
                continue;
            }
            visited.add(key);
            queue.push(next);
        }
    }
    return bestExpr;
}
function buildRewrites(identities) {
    const rewrites = [];
    for (const [left, right] of identities) {
        maybeAddRewrite(rewrites, left, right);
        maybeAddRewrite(rewrites, right, left);
    }
    return rewrites;
}
function maybeAddRewrite(rewrites, pattern, replacement) {
    if (pattern.type === 'variable') {
        return;
    }
    const patternVars = collectVariables(pattern);
    const replacementVars = collectVariables(replacement);
    for (const variable of replacementVars) {
        if (!patternVars.has(variable)) {
            return;
        }
    }
    rewrites.push({ pattern, replacement });
}
function collectVariables(expr, result = new Set()) {
    switch (expr.type) {
        case 'number':
            return result;
        case 'variable':
            result.add(expr.name);
            return result;
        case 'negate':
            return collectVariables(expr.operand, result);
        case 'binary':
            collectVariables(expr.left, result);
            collectVariables(expr.right, result);
            return result;
    }
}
function produceNeighbours(expr, rewrites) {
    const result = [];
    const seen = new Set();
    const dfs = (node, path) => {
        for (const { pattern, replacement } of rewrites) {
            const bindings = new Map();
            if (matches(pattern, node, bindings)) { // получили сопоставления эл-тов из pattern - левой части тождества  -> эл-тов из node
                const substituted = substitute(replacement, bindings); // на основе сопоставления меняем в итоговом replacement (правой части тождества) всё что надо на то что в сопоставлении
                const rewritten = replaceAt(expr, path, substituted); // меняем в дереве один подузел на новое выражение.
                const key = exprKey(rewritten);
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push(rewritten);
                }
            }
        }
        const foldedValue = evaluateConstant(node);
        if (foldedValue !== undefined && (node.type !== 'number' || node.value !== foldedValue)) {
            const rewritten = replaceAt(expr, path, { type: 'number', value: foldedValue });
            const key = exprKey(rewritten);
            if (!seen.has(key)) {
                seen.add(key);
                result.push(rewritten);
            }
        }
        switch (node.type) {
            case 'binary':
                dfs(node.left, [...path, 'left']);
                dfs(node.right, [...path, 'right']);
                break;
            case 'negate':
                dfs(node.operand, [...path, 'operand']);
                break;
        }
    };
    dfs(expr, []);
    return result;
}
function evaluateConstant(expr) {
    switch (expr.type) {
        case 'number':
            return expr.value;
        case 'variable':
            return undefined;
        case 'negate': {
            const operand = evaluateConstant(expr.operand);
            return operand === undefined ? undefined : -operand;
        }
        case 'binary': {
            const left = evaluateConstant(expr.left);
            const right = evaluateConstant(expr.right);
            if (left === undefined || right === undefined) {
                return undefined;
            }
            return evaluateBinary(expr.op, left, right);
        }
    }
}
function evaluateBinary(op, left, right) {
    switch (op) {
        case 'add':
            return left + right;
        case 'sub':
            return left - right;
        case 'mul':
            return left * right;
        case 'div':
            return right === 0 ? undefined : left / right;
    }
}
function matches(pattern, expr, bindings) {
    if (pattern.type === 'number') {
        return expr.type === 'number' && expr.value === pattern.value;
    }
    if (pattern.type === 'variable') {
        const existing = bindings.get(pattern.name);
        if (!existing) {
            bindings.set(pattern.name, expr);
            return true;
        }
        return exprEquals(existing, expr);
    }
    if (pattern.type === 'negate') {
        return expr.type === 'negate' && matches(pattern.operand, expr.operand, bindings);
    }
    if (pattern.type === 'binary') {
        return expr.type === 'binary'
            && pattern.op === expr.op
            && matches(pattern.left, expr.left, bindings)
            && matches(pattern.right, expr.right, bindings);
    }
    return false;
}
function substitute(pattern, bindings) {
    switch (pattern.type) {
        case 'number':
            return { type: 'number', value: pattern.value };
        case 'variable': {
            const bound = bindings.get(pattern.name);
            if (!bound) {
                throw new Error(`Missing binding for ${pattern.name}`);
            }
            return cloneExpr(bound);
        }
        case 'negate':
            return { type: 'negate', operand: substitute(pattern.operand, bindings) };
        case 'binary':
            return {
                type: 'binary',
                op: pattern.op,
                left: substitute(pattern.left, bindings),
                right: substitute(pattern.right, bindings),
            };
    }
}
function replaceAt(expr, path, replacement) {
    if (path.length === 0) {
        return cloneExpr(replacement);
    } //база
    const [step, ...rest] = path; //первый шаг и все дальнейшие
    switch (expr.type) {
        case 'binary':
            if (step === 'left') {
                return {
                    type: 'binary',
                    op: expr.op,
                    left: replaceAt(expr.left, rest, replacement),
                    right: expr.right,
                };
            }
            if (step === 'right') {
                return {
                    type: 'binary',
                    op: expr.op,
                    left: expr.left,
                    right: replaceAt(expr.right, rest, replacement),
                };
            }
            break;
        case 'negate':
            if (step === 'operand') {
                return {
                    type: 'negate',
                    operand: replaceAt(expr.operand, rest, replacement),
                };
            }
            break;
    }
    throw new Error('Invalid replacement path');
}
function exprEquals(a, b) {
    if (a.type !== b.type) {
        return false;
    }
    switch (a.type) {
        case 'number':
            return b.type === 'number' && a.value === b.value;
        case 'variable':
            return b.type === 'variable' && a.name === b.name;
        case 'negate':
            return b.type === 'negate' && exprEquals(a.operand, b.operand);
        case 'binary':
            return b.type === 'binary'
                && a.op === b.op
                && exprEquals(a.left, b.left)
                && exprEquals(a.right, b.right);
    }
}
function cloneExpr(expr) {
    switch (expr.type) {
        case 'number':
            return { type: 'number', value: expr.value };
        case 'variable':
            return { type: 'variable', name: expr.name };
        case 'negate':
            return { type: 'negate', operand: cloneExpr(expr.operand) };
        case 'binary':
            return {
                type: 'binary',
                op: expr.op,
                left: cloneExpr(expr.left),
                right: cloneExpr(expr.right),
            };
    }
}
function exprKey(expr) {
    switch (expr.type) {
        case 'number':
            return `n:${expr.value}`;
        case 'variable':
            return `v:${expr.name}`;
        case 'negate':
            return `neg(${exprKey(expr.operand)})`;
        case 'binary':
            return `b:${expr.op}(${exprKey(expr.left)},${exprKey(expr.right)})`;
    }
}
//# sourceMappingURL=simplify.js.map