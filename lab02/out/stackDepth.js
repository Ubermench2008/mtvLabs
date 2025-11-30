"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpnStackDepth = void 0;
const asItems = (items) => items.children;
const combineDepth = (left, right) => ({
    need: Math.max(left.need, right.need - left.out),
    out: left.out + right.out,
    max: Math.max(left.max, left.out + right.max),
});
const numberEffect = { max: 1, out: 1, need: 0 };
const operatorEffect = { max: 0, out: -1, need: 2 };
const numberEffectFor = (token) => {
    if (!/^\d+$/u.test(token)) {
        throw new Error(`Invalid token: ${token}`);
    }
    return numberEffect;
};
exports.rpnStackDepth = {
    Start(_leading, items, _trailing) {
        let total;
        for (const item of asItems(items)) {
            const token = item.sourceString.trim();
            const effect = token === "+" || token === "*" ? operatorEffect : numberEffectFor(token);
            total = total ? combineDepth(total, effect) : effect;
        }
        if (!total) {
            throw new Error("Empty expression has no stack depth");
        }
        return total;
    },
    number(_digits) {
        return numberEffect;
    },
    _(_spaces) {
        return { max: 0, out: 0, need: 0 };
    },
};
//# sourceMappingURL=stackDepth.js.map