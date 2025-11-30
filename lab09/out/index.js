"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ExportWrapper_exports;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportWrapper = void 0;
exports.parseAndCompile = parseAndCompile;
const lab08_1 = require("../../lab08");
const compiler_1 = require("./compiler");
class ExportWrapper {
    constructor(exports) {
        _ExportWrapper_exports.set(this, void 0);
        __classPrivateFieldSet(this, _ExportWrapper_exports, exports, "f");
        return new Proxy(this, {
            get(target, p) {
                if (p == "then")
                    return undefined; // fail the Promise test
                const f = __classPrivateFieldGet(target, _ExportWrapper_exports, "f")[p];
                if (typeof f !== "function")
                    return undefined;
                return (...a) => {
                    if (a.length != f.length)
                        throw new Error(`Argument count mistmatch. Expected: ${f.length}, passed: ${a.length}.`);
                    return f(...a);
                };
            }
        });
    }
}
exports.ExportWrapper = ExportWrapper;
_ExportWrapper_exports = new WeakMap();
async function parseAndCompile(name, source) {
    const ast = (0, lab08_1.parseFunny)(source);
    const mod = await (0, compiler_1.compileModule)(ast, name);
    return new ExportWrapper(mod);
}
__exportStar(require("./compiler"), exports);
//# sourceMappingURL=index.js.map