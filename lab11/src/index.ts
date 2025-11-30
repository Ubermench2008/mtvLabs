import { ExportWrapper, compileModule } from "@tvm/lab09";
import { parseFunnier } from "./parser";
import { verifyModule } from "./verifier";

export async function parseVerifyAndCompile(_name: string, source: string): Promise<Record<string, Function>> {
    const ast = parseFunnier(source);
    await verifyModule(ast);
    const mod = await compileModule(ast);
    return new ExportWrapper(mod);
}
