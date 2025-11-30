import { readFileSync } from "node:fs";
import { join } from "node:path";

import { arithGrammar } from "../../lab03";
import type { Condition as FunnyCondition } from "@tvm/lab08";
import { FunnyError } from "@tvm/lab08";
import { getFunnyAst as funnyAst } from "@tvm/lab08/out/parser";
import * as ohm from "ohm-js";
import type { MatchResult, Semantics } from "ohm-js";

import {
    AnnotatedFunctionDef,
    AnnotatedModule,
    AnnotatedWhileStatement,
    Predicate,
    QuantifierPredicate,
    createBoolPredicate,
} from "./funnier";
import { resolveModule } from "./resolver";

type FunnierActionDict<T> = Record<string, (...args: any[]) => T>;

const grammarSource = loadFunnierGrammarSource();
const grammar = ohm.grammars(grammarSource, { Arithmetic: arithGrammar }).Funnier;

function loadFunnierGrammarSource(): string {
    const base = readGrammarFile([
        join(__dirname, "../../lab08/src/funny.ohm.t"),
        join(__dirname, "../../../lab08/src/funny.ohm.t"),
    ]);
    const extension = readGrammarFile([
        join(__dirname, "funnier.ohm.t"),
        join(__dirname, "../src/funnier.ohm.t"),
    ]);
    return `${base}\n${extension}`;
}

function readGrammarFile(candidates: string[]): string {
    for (const candidate of candidates) {
        try {
            return readFileSync(candidate, "utf-8");
        } catch {
            // Try next candidate
        }
    }
    throw new Error(`Unable to read grammar file from paths: ${candidates.join(", ")}`);
}

const optionalNode = <T>(node: any): T | undefined => {
    if (!node || node.children.length === 0) {
        return undefined;
    }
    return node.children[0].parse();
};

const parseOptionalPredicate = (node: any, fallback: () => Predicate): Predicate => {
    const parsed = optionalNode<Predicate>(node);
    return parsed ?? fallback();
};

const getFunnierAst = {
    ...funnyAst,
    Module(_before, functions, _after) {
        return {
            type: "module",
            functions: functions.children.map((fn: any) => fn.parse()),
        } satisfies AnnotatedModule;
    },
    FunctionDef(
        name,
        _gap1,
        _open,
        _gap2,
        paramsOpt,
        _gap3,
        _close,
        _gap4,
        requiresOpt,
        _returns,
        _gap5,
        returnList,
        _gap6,
        ensuresOpt,
        localsOpt,
        body,
    ) {
        return {
            type: "fun",
            name: name.parse(),
            parameters: optionalNode(paramsOpt) ?? [],
            returns: returnList.parse(),
            locals: optionalNode(localsOpt) ?? [],
            requires: parseOptionalPredicate(requiresOpt, () => createBoolPredicate(true)),
            ensures: parseOptionalPredicate(ensuresOpt, () => createBoolPredicate(false)),
            body: body.parse(),
        } satisfies AnnotatedFunctionDef;
    },
    FunctionRequires(_requires, _gap, predicate, _trail) {
        return predicate.parse();
    },
    FunctionEnsures(_ensures, _gap, predicate, _trail) {
        return predicate.parse();
    },
    While(_while, _gap1, _open, _gap2, condition, _gap3, _close, _gap4, invariantOpt, body) {
        return {
            type: "while",
            condition: condition.parse(),
            body: body.parse(),
            invariant: parseOptionalPredicate(invariantOpt, () => createBoolPredicate(true)),
        } satisfies AnnotatedWhileStatement;
    },
    WhileInvariant(_keyword, _gap, predicate, _trail) {
        return predicate.parse();
    },
    Predicate_true(_true) {
        return createBoolPredicate(true);
    },
    Predicate_false(_false) {
        return createBoolPredicate(false);
    },
    Predicate_not(_not, _gap, predicate) {
        return { type: "not", operand: predicate.parse() } satisfies Predicate;
    },
    Predicate_and(left, _gap1, _and, _gap2, right) {
        return { type: "and", left: left.parse(), right: right.parse() } satisfies Predicate;
    },
    Predicate_or(left, _gap1, _or, _gap2, right) {
        return { type: "or", left: left.parse(), right: right.parse() } satisfies Predicate;
    },
    Predicate_implies(left, _gap1, _arrow, _gap2, right) {
        return { type: "implies", left: left.parse(), right: right.parse() } satisfies Predicate;
    },
    Predicate_paren(_open, _before, predicate, _after, _close) {
        return predicate.parse();
    },
    Predicate_comparison(comparison) {
        return comparison.parse();
    },
    Predicate_quantifier(quantifier) {
        return quantifier.parse();
    },
    Quantifier(kind, _gap1, _open, _gap2, variable, _gap3, _pipe, _gap4, predicate, _gap5, _close) {
        return {
            type: kind.parse(),
            variable: variable.parse(),
            predicate: predicate.parse(),
        } satisfies QuantifierPredicate;
    },
    QuantifierType_forall(_forall) {
        return "forall" as const;
    },
    QuantifierType_exists(_exists) {
        return "exists" as const;
    },
    Condition_implies(left, _gap1, _arrow, _gap2, right) {
        const lhs = left.parse();
        const rhs = right.parse();
        return {
            type: "or",
            left: { type: "not", operand: lhs },
            right: rhs,
        } satisfies FunnyCondition;
    },
} satisfies FunnierActionDict<any>;

export const semantics: FunnySemanticsExt = grammar.createSemantics() as FunnySemanticsExt;
semantics.addOperation("parse()", getFunnierAst);

export interface FunnySemanticsExt extends Semantics {
    (match: MatchResult): FunnyActionsExt;
}

interface FunnyActionsExt {
    parse(): AnnotatedModule;
}

export function parseFunnier(source: string): AnnotatedModule {
    const match = grammar.match(source, "Module");
    if (match.failed()) {
        const idx = (match as any).getRightmostFailurePosition?.() ?? 0;
        const { line, column } = getLineAndColumn(source, idx);
        throw new FunnyError("Syntax error", "SyntaxError", line, column);
    }

    const moduleAst = (semantics(match) as FunnyActionsExt).parse();
    resolveModule(moduleAst);
    return moduleAst;
}

function getLineAndColumn(source: string, index: number): { line: number; column: number } {
    const limit = Math.max(0, Math.min(index, source.length));
    let line = 1;
    let column = 1;
    for (let i = 0; i < limit; i += 1) {
        if (source[i] === "\n") {
            line += 1;
            column = 1;
        } else {
            column += 1;
        }
    }
    return { line, column };
}
