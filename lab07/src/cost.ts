import { Expr } from "../../lab04";

export function cost(expr: Expr): number {
    switch (expr.type) {
        case 'number':
            return 0;
        case 'variable':
            return 1;
        case 'negate':
            return 1 + cost(expr.operand);
        case 'binary':
            return 1 + cost(expr.left) + cost(expr.right);
    }
}
