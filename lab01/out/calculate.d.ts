import { Dict, MatchResult, Semantics } from "ohm-js";
export declare const addMulSemantics: AddMulSemantics;
interface AddMulDict extends Dict {
    calculate(): number;
}
interface AddMulSemantics extends Semantics {
    (match: MatchResult): AddMulDict;
}
export {};
