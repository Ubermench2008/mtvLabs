"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semantics = exports.getExprAst = void 0;
exports.parseExpr = parseExpr;
const lab03_1 = require("../../lab03");
const parseNode = (node) => node.parse();
const binaryOperatorFromToken = (token) => {
    switch (token) {
        case '+':
            return 'add';
        case '-':
            return 'sub';
        case '*':
            return 'mul';
        case '/':
            return 'div';
        default:
            throw new lab03_1.SyntaxError(`Unsupported operator: ${token}`);
    }
};
const reduceBinaryChain = (first, rest) => {
    let expr = parseNode(first);
    for (const chunk of rest.children) {
        const opToken = chunk.child(1).sourceString;
        const rhsNode = chunk.child(3);
        expr = {
            type: 'binary',
            op: binaryOperatorFromToken(opToken),
            left: expr,
            right: parseNode(rhsNode),
        };
    }
    return expr;
};
exports.getExprAst = {
    Additive(first, rest) {
        return reduceBinaryChain(first, rest);
    },
    Multiplicative(first, rest) {
        return reduceBinaryChain(first, rest);
    },
    Unary_neg(_minus, _gap, value) {
        return {
            type: 'negate',
            operand: parseNode(value),
        };
    },
    Unary_base(value) {
        return parseNode(value);
    },
    Unary(value) {
        return parseNode(value);
    },
    Primary_number(num) {
        return parseNode(num);
    },
    Primary_variable(variable) {
        return parseNode(variable);
    },
    Primary_paren(_open, _before, expr, _after, _close) {
        return parseNode(expr);
    },
    Primary(value) {
        return parseNode(value);
    },
    number(_digits) {
        return {
            type: 'number',
            value: Number(this.sourceString),
        };
    },
    variable(_first, _rest) {
        return {
            type: 'variable',
            name: this.sourceString,
        };
    },
};
exports.semantics = lab03_1.arithGrammar.createSemantics();
exports.semantics.addOperation('parse()', exports.getExprAst);
function parseExpr(source) {
    const match = lab03_1.arithGrammar.match(source.trim());
    if (match.failed()) {
        throw new lab03_1.SyntaxError('Syntax error');
    }
    const operations = exports.semantics(match);
    return operations.parse();
}
//# sourceMappingURL=parser.js.map