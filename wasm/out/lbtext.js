"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printCode = printCode;
const info_1 = require("./info");
const ast_1 = require("./ast");
// Maps opname to opcode
const opnames = new Map();
for (const opcodeString in info_1.opcodes) {
    const opcode = Number.parseInt(opcodeString);
    opnames.set(info_1.opcodes[opcode], opcode);
}
;
function readVarInt7(byte) {
    return byte < 64 ? byte : -(128 - byte);
}
function fmtimm(n) {
    switch (n.t) {
        case ast_1.t.uint8:
        case ast_1.t.uint16:
        case ast_1.t.uint32:
        case ast_1.t.varuint1:
        case ast_1.t.varuint7:
        case ast_1.t.varuint32:
        case ast_1.t.varint32:
        case ast_1.t.varint64:
        case ast_1.t.float32:
        case ast_1.t.float64: {
            return n.v.toString(10);
        }
        case ast_1.t.varint7: {
            return readVarInt7(n.v).toString(10);
        }
        case ast_1.t.type: {
            switch (n.v) {
                case -1: return 'i32';
                case -2: return 'i64';
                case -3: return 'f32';
                case -4: return 'f64';
                case -0x10: return 'anyfunc';
                case -0x20: return 'func';
                case -0x40: return 'void'; // aka empty_block
                default:
                    throw new Error('unexpected type ' + n.t.toString());
            }
        }
        default:
            throw new Error('unexpected imm ' + n.t.toString());
    }
}
function fmtimmv(n) {
    return n.map(n => ' ' + fmtimm(n)).join('');
}
function visitOps(nodes, c, depth) {
    for (let n of nodes) {
        visitOp(n, c, depth);
    }
}
function visitOp(n, c, depth) {
    // const tname = style(symname(n.t), '92')
    if (n instanceof ast_1.instr_atom) {
        if (n.v == 0x0b /*end*/ || n.v == 0x05 /*else*/)
            depth--;
        c.writeln(depth, info_1.opcodes[n.v]);
        return;
    }
    else if (n instanceof ast_1.instr_imm1) {
        c.writeln(depth, info_1.opcodes[n.v] + ' ' + fmtimm(n.imm));
    }
    else if (n instanceof ast_1.instr_pre) {
        visitOps(n.pre, c, depth);
        c.writeln(depth, info_1.opcodes[n.v]);
    }
    else if (n instanceof ast_1.instr_pre1) {
        visitOp(n.pre, c, depth);
        c.writeln(depth, info_1.opcodes[n.v]);
    }
    else if (n instanceof ast_1.instr_imm1_post) {
        c.writeln(depth, info_1.opcodes[n.v] + ' ' + fmtimm(n.imm));
        visitOps(n.post, c, depth + 1);
    }
    else if (n instanceof ast_1.instr_pre_imm) {
        visitOps(n.pre, c, depth);
        c.writeln(depth, info_1.opcodes[n.v] + fmtimmv(n.imm));
    }
    else if (n instanceof ast_1.instr_pre_imm_post) {
        visitOps(n.pre, c, depth);
        c.writeln(depth, info_1.opcodes[n.v] + fmtimmv(n.imm));
        visitOps(n.post, c, depth + 1);
    }
    else
        throw new Error('unexpected op ' + n.t.toString());
}
function printCode(instructions, writer) {
    const ctx = {
        writeln(depth, chunk) {
            writer("  ".repeat(depth) + chunk + '\n');
        },
    };
    visitOps(instructions, ctx, 0);
}
//# sourceMappingURL=lbtext.js.map