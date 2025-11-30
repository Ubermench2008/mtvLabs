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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.semantics = void 0;
exports.parseFunnier = parseFunnier;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const src_1 = require("lab08/src");
const parser_1 = require("lab08/src/parser");
const lab03_1 = require("../../lab03");
const ohm = __importStar(require("ohm-js"));
const funnier_1 = require("./funnier");
const resolver_1 = require("./resolver");
const grammarSource = loadFunnierGrammarSource();
const grammar = ohm.grammars(grammarSource, { Arithmetic: lab03_1.arithGrammar }).Funnier;
function loadFunnierGrammarSource() {
    const base = readGrammarFile([
        (0, node_path_1.join)(__dirname, '../../lab08/src/funny.ohm.t'),
        (0, node_path_1.join)(__dirname, '../../../lab08/src/funny.ohm.t'),
    ]);
    const extension = readGrammarFile([
        (0, node_path_1.join)(__dirname, 'funnier.ohm.t'),
        (0, node_path_1.join)(__dirname, '../src/funnier.ohm.t'),
    ]);
    return `${base}\n${extension}`;
}
function readGrammarFile(candidates) {
    for (const candidate of candidates) {
        try {
            return (0, node_fs_1.readFileSync)(candidate, 'utf-8');
        }
        catch (_a) {
            // Try next candidate
        }
    }
    throw new Error(`Unable to read grammar file from paths: ${candidates.join(', ')}`);
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
    ...parser_1.getFunnyAst,
    Module(_before, functions, _after) {
        return {
            type: 'module',
            functions: functions.children.map((fn) => fn.parse()),
        };
    },
    FunctionDef(name, _gap1, _open, _gap2, paramsOpt, _gap3, _close, _gap4, requiresOpt, _returns, _gap5, returnList, _gap6, ensuresOpt, localsOpt, body) {
        var _a, _b;
        return {
            type: 'fun',
            name: name.parse(),
            parameters: (_a = optionalNode(paramsOpt)) !== null && _a !== void 0 ? _a : [],
            returns: returnList.parse(),
            locals: (_b = optionalNode(localsOpt)) !== null && _b !== void 0 ? _b : [],
            requires: parseOptionalPredicate(requiresOpt, () => (0, funnier_1.createBoolPredicate)(true)),
            ensures: parseOptionalPredicate(ensuresOpt, () => (0, funnier_1.createBoolPredicate)(false)),
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
            type: 'while',
            condition: condition.parse(),
            body: body.parse(),
            invariant: parseOptionalPredicate(invariantOpt, () => (0, funnier_1.createBoolPredicate)(true)),
        };
    },
    WhileInvariant(_keyword, _gap, predicate, _trail) {
        return predicate.parse();
    },
    Predicate_true(_true) {
        return (0, funnier_1.createBoolPredicate)(true);
    },
    Predicate_false(_false) {
        return (0, funnier_1.createBoolPredicate)(false);
    },
    Predicate_not(_not, _gap, predicate) {
        return { type: 'not', operand: predicate.parse() };
    },
    Predicate_and(left, _gap1, _and, _gap2, right) {
        return { type: 'and', left: left.parse(), right: right.parse() };
    },
    Predicate_or(left, _gap1, _or, _gap2, right) {
        return { type: 'or', left: left.parse(), right: right.parse() };
    },
    Predicate_implies(left, _gap1, _arrow, _gap2, right) {
        return { type: 'implies', left: left.parse(), right: right.parse() };
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
        return 'forall';
    },
    QuantifierType_exists(_exists) {
        return 'exists';
    },
    Condition_implies(left, _gap1, _arrow, _gap2, right) {
        const lhs = left.parse();
        const rhs = right.parse();
        return {
            type: 'or',
            left: { type: 'not', operand: lhs },
            right: rhs,
        };
    },
};
exports.semantics = grammar.createSemantics();
exports.semantics.addOperation('parse()', getFunnierAst);
function parseFunnier(source, origin) {
    var _a, _b, _c;
    const match = grammar.match(source, 'Module');
    if (match.failed()) {
        const idx = (_c = (_b = (_a = match).getRightmostFailurePosition) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
        const { line, column } = getLineAndColumn(source, idx);
        throw new src_1.FunnyError('Syntax error', 'SyntaxError', line, column);
    }
    const moduleAst = (0, exports.semantics)(match).parse();
    (0, resolver_1.resolveModule)(moduleAst);
    return moduleAst;
}
function getLineAndColumn(source, index) {
    const limit = Math.max(0, Math.min(index, source.length));
    let line = 1;
    let column = 1;
    for (let i = 0; i < limit; i += 1) {
        if (source[i] === '\n') {
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