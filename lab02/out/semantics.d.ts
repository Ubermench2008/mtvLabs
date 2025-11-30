import { Dict, MatchResult, Semantics } from "ohm-js";
import { StackDepth } from "./stackDepth";
interface RpnDict extends Dict {
    calculate(): number;
    stackDepth: StackDepth;
}
interface RpnSemantics extends Semantics {
    (match: MatchResult): RpnDict;
}
export declare const rpnSemantics: RpnSemantics;
export {};
