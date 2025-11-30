import type { MatchResult, Semantics } from "ohm-js";
import { AnnotatedModule } from "./funnier";
export declare const semantics: FunnySemanticsExt;
export interface FunnySemanticsExt extends Semantics {
    (match: MatchResult): FunnyActionsExt;
}
interface FunnyActionsExt {
    parse(): AnnotatedModule;
}
export declare function parseFunnier(source: string): AnnotatedModule;
export {};
