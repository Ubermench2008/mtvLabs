"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printExpr = printExpr;
const operatorSymbols = {
    add: '+',
    sub: '-',
    mul: '*',
    div: '/',
};
const operatorPrecedence = {
    add: 1,
    sub: 1,
    mul: 2,
    div: 2,
    negate: 3,
};
function printExpr(e) {
    return render(e);
}
function render(expr, parentOp, position) {
    let printed;
    switch (expr.type) {
        case 'number':
            printed = expr.value.toString();
            break;
        case 'variable':
            printed = expr.name;
            break;
        case 'negate': {
            const operandStr = render(expr.operand, 'negate', 'right');
            printed = `-${operandStr}`;
            break;
        }
        case 'binary': {
            const left = render(expr.left, expr.op, 'left');
            const right = render(expr.right, expr.op, 'right');
            printed = `${left} ${operatorSymbols[expr.op]} ${right}`;
            break;
        }
    }
    if (!parentOp || position === undefined) {
        return printed;
    }
    if (parentOp === 'negate') {
        return needsParenUnderNegate(expr) ? `(${printed})` : printed;
    }
    return needsParenUnderBinary(parentOp, expr, position) ? `(${printed})` : printed;
}
function needsParenUnderNegate(child) {
    if (child.type === 'binary') {
        return true;
    }
    return false;
}
function needsParenUnderBinary(parentOp, child, position) {
    if (child.type !== 'binary') {
        return false;
    }
    const childOp = child.op;
    const parentPrec = operatorPrecedence[parentOp];
    const childPrec = operatorPrecedence[childOp];
    if (childPrec < parentPrec) {
        return true;
    }
    if (childPrec > parentPrec) {
        return false;
    }
    if (position === 'left') {
        return false;
    }
    switch (parentOp) {
        case 'add':
            return false;
        case 'sub':
            return true;
        case 'mul':
            return childOp === 'div';
        case 'div':
            return true;
    }
    return false;
}
//# sourceMappingURL=printExpr.js.map