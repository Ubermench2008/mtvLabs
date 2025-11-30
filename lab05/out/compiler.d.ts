import { Expr } from "../../lab04";
import { Fn } from "./emitHelper";
export declare function getVariables(e: Expr): string[];
export declare function buildFunction(e: Expr, variables: string[]): Promise<Fn<number>>;
