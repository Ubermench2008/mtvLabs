import { ExportWrapper, compileModule } from "@tvm/lab09";
import { parseFunnier } from "./parser";
import { verifyModule } from "./verifier";
export async function parseVerifyAndCompile(_name, source) {
    const ast = parseFunnier(source);
    await verifyModule(ast);
    const mod = await compileModule(ast);
    return new ExportWrapper(mod);
}
//# sourceMappingURL=index.js.map