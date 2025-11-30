import { readFileSync } from "node:fs";
import { join } from "node:path";
import { arithGrammar } from "../../lab03";
import { FunnyError } from "@tvm/lab08";
import { getFunnyAst as funnyAst } from "@tvm/lab08/out/parser";
import * as ohm from "ohm-js";
import { createBoolPredicate, } from "./funnier";
import { resolveModule } from "./resolver";
const grammarSource = loadFunnierGrammarSource();
const grammar = ohm.grammars(grammarSource, { Arithmetic: arithGrammar }).Funnier;
function loadFunnierGrammarSource() {
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
function readGrammarFile(candidates) {
    for (const candidate of candidates) {
        try {
            return readFileSync(candidate, "utf-8");
        }
        catch (_a) {
            // Try next candidate
        }
    }
    throw new Error(`Unable to read grammar file from paths: ${candidates.join(", ")}`);
}
const optionalNode = (node) => {
    if (!node || node.children.length === 0) {
        return undefined;
    }
    return node.children[0].parse();
};
const parseOptionalPredicate = (node, fallback) => {
    const parsed = optionalNode(node);
    return parsed !== null && parsed !== void 0 ? parsed : fallback();
};
const getFunnierAst = {
    ...funnyAst,
    Module(_before, functions, _after) {
        return {
            type: "module",
            functions: functions.children.map((fn) => fn.parse()),
        };
    },
    FunctionDef(name, _gap1, _open, _gap2, paramsOpt, _gap3, _close, _gap4, requiresOpt, _returns, _gap5, returnList, _gap6, ensuresOpt, localsOpt, body) {
        var _a, _b;
        return {
            type: "fun",
            name: name.parse(),
            parameters: (_a = optionalNode(paramsOpt)) !== null && _a !== void 0 ? _a : [],
            returns: returnList.parse(),
            locals: (_b = optionalNode(localsOpt)) !== null && _b !== void 0 ? _b : [],
            requires: parseOptionalPredicate(requiresOpt, () => createBoolPredicate(true)),
            ensures: parseOptionalPredicate(ensuresOpt, () => createBoolPredicate(false)),
            body: body.parse(),
        };
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
        };
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
        return { type: "not", operand: predicate.parse() };
    },
    Predicate_and(left, _gap1, _and, _gap2, right) {
        return { type: "and", left: left.parse(), right: right.parse() };
    },
    Predicate_or(left, _gap1, _or, _gap2, right) {
        return { type: "or", left: left.parse(), right: right.parse() };
    },
    Predicate_implies(left, _gap1, _arrow, _gap2, right) {
        return { type: "implies", left: left.parse(), right: right.parse() };
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
        };
    },
    QuantifierType_forall(_forall) {
        return "forall";
    },
    QuantifierType_exists(_exists) {
        return "exists";
    },
    Condition_implies(left, _gap1, _arrow, _gap2, right) {
        const lhs = left.parse();
        const rhs = right.parse();
        return {
            type: "or",
            left: { type: "not", operand: lhs },
            right: rhs,
        };
    },
};
export const semantics = grammar.createSemantics();
semantics.addOperation("parse()", getFunnierAst);
export function parseFunnier(source) {
    var _a, _b, _c;
    const match = grammar.match(source, "Module");
    if (match.failed()) {
        const idx = (_c = (_b = (_a = match).getRightmostFailurePosition) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
        const { line, column } = getLineAndColumn(source, idx);
        throw new FunnyError("Syntax error", "SyntaxError", line, column);
    }
    const moduleAst = semantics(match).parse();
    resolveModule(moduleAst);
    return moduleAst;
}
function getLineAndColumn(source, index) {
    const limit = Math.max(0, Math.min(index, source.length));
    let line = 1;
    let column = 1;
    for (let i = 0; i < limit; i += 1) {
        if (source[i] === "\n") {
            line += 1;
            column = 1;
        }
        else {
            column += 1;
        }
    }
    return { line, column };
}
//# sourceMappingURL=parser.js.map