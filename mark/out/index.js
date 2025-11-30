"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = test;
const desiredMark_json_1 = require("../../desiredMark.json");
const globals_1 = require("@jest/globals");
function test(name, testMark, fn, expected, ...args) {
    if (desiredMark_json_1.desiredMark >= testMark) {
        if (typeof expected === "function") {
            if (isConstructor(expected)) // exception case
                (0, globals_1.test)(name, async () => await expect(async () => (await fn(...args))).rejects.toThrow(expected));
            else // deferred value case
                (0, globals_1.test)(name, async () => expect(await fn(...args)).toEqual(expected()));
        }
        else
            (0, globals_1.test)(name, async () => expect(await fn(...args)).toEqual(expected));
    }
    else
        globals_1.test.skip(name, () => { });
}
;
const handler = { construct() { return handler; } }; //Must return ANY object, so reuse one
const isConstructor = (x) => {
    try {
        return !!(new (new Proxy(x, handler))());
    }
    catch (e) {
        return false;
    }
};
//# sourceMappingURL=index.js.map