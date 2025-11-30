"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOneFunctionModule = buildOneFunctionModule;
const wasm_1 = require("../../wasm");
async function buildOneFunctionModule(name, argCount, body) {
    const mod = wasm_1.c.module([
        wasm_1.c.type_section([
            wasm_1.c.func_type(Array(argCount).fill(wasm_1.c.i32), wasm_1.c.i32), // type index = 0
        ]),
        wasm_1.c.function_section([
            wasm_1.c.varuint32(0), // function index = 0, uses type index 0
        ]),
        wasm_1.c.export_section([
            wasm_1.c.export_entry(wasm_1.c.str_ascii(name), wasm_1.c.external_kind.function, wasm_1.c.varuint32(0)),
        ]),
        wasm_1.c.code_section([
            // body of function at index 0:
            wasm_1.c.function_body([ /* no additional local variables */], body)
        ])
    ]);
    const emitter = new wasm_1.BufferedEmitter(new ArrayBuffer(mod.z));
    mod.emit(emitter);
    const module = await WebAssembly.instantiate(emitter.buffer);
    const exported = module.instance.exports[name];
    return exported;
}
//# sourceMappingURL=emitHelper.js.map