"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cost = cost;
function cost(expr) {
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
//# sourceMappingURL=cost.js.map