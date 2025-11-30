import { IterationNode, MatchResult, NonterminalNode, TerminalNode } from 'ohm-js';
import { arithGrammar, ArithmeticActionDict, ArithmeticSemantics, SyntaxError } from '../../lab03';
import { BinaryOperator, Expr } from './ast';

type ExprNode = NonterminalNode & {
    parse(): Expr;
};

const parseNode = (node: NonterminalNode): Expr => (node as ExprNode).parse();

const binaryOperatorFromToken = (token: string): BinaryOperator => {
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
            throw new SyntaxError(`Unsupported operator: ${token}`);
    }
};

const reduceBinaryChain = (first: NonterminalNode, rest: IterationNode): Expr => {
    let expr = parseNode(first);
    for (const chunk of rest.children as NonterminalNode[]) {
        const opToken = chunk.child(1).sourceString;
        const rhsNode = chunk.child(3) as NonterminalNode;
        expr = {
            type: 'binary',
            op: binaryOperatorFromToken(opToken),
            left: expr,
            right: parseNode(rhsNode),
        };
    }
    return expr;
};

export const getExprAst: ArithmeticActionDict<Expr> = {
    Additive(first: NonterminalNode, rest: IterationNode) {
        return reduceBinaryChain(first, rest);
    },

    Multiplicative(first: NonterminalNode, rest: IterationNode) {
        return reduceBinaryChain(first, rest);
    },

    Unary_neg(_minus: TerminalNode, _gap: NonterminalNode, value: NonterminalNode) {
        return {
            type: 'negate',
            operand: parseNode(value),
        };
    },
    Unary_base(value: NonterminalNode) {
        return parseNode(value);
    },
    Unary(value: NonterminalNode) {
        return parseNode(value);
    },

    Primary_number(num: NonterminalNode) {
        return parseNode(num);
    },
    Primary_variable(variable: NonterminalNode) {
        return parseNode(variable);
    },
    Primary_paren(
        _open: TerminalNode,
        _before: NonterminalNode,
        expr: NonterminalNode,
        _after: NonterminalNode,
        _close: TerminalNode,
    ) {
        return parseNode(expr);
    },
    Primary(value: NonterminalNode) {
        return parseNode(value);
    },

    number(_digits: IterationNode) {
        return {
            type: 'number',
            value: Number(this.sourceString),
        };
    },

    variable(_first: NonterminalNode, _rest: IterationNode) {
        return {
            type: 'variable',
            name: this.sourceString,
        };
    },
};

export const semantics = arithGrammar.createSemantics();
semantics.addOperation('parse()', getExprAst);

export interface ArithSemanticsExt extends ArithmeticSemantics {
    (match: MatchResult): ArithActionsExt;
}

export interface ArithActionsExt {
    parse(): Expr;
}

export function parseExpr(source: string): Expr {
    const match = arithGrammar.match(source.trim());
    if (match.failed()) {
        throw new SyntaxError('Syntax error');
    }
    const operations = (semantics as unknown as ArithSemanticsExt)(match);
    return operations.parse();
}
