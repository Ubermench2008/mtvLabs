"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.c = exports.t = exports.sect_id = exports.instr_pre_imm_post = exports.instr_pre_imm = exports.instr_imm1_post = exports.instr_pre = exports.instr_imm1 = exports.instr_pre1 = exports.instr_cell = exports.instr_atom = exports.type_atom = void 0;
const utf8_1 = require("./utf8");
const DEBUG = false;
const assert = DEBUG ? function (cond, msg) {
    if (!cond) {
        throw new Error('assertion failure');
    }
} : function () { };
//——————————————————————————————————————————————————————————————————————————————
// Type tags
const T = {
    // Atoms
    uint8: Symbol.for('u8'),
    uint16: Symbol.for('u16'),
    uint32: Symbol.for('u32'),
    varuint1: Symbol.for('vu1'),
    varuint7: Symbol.for('vu7'),
    varuint32: Symbol.for('vu32'),
    varint7: Symbol.for('vs7'),
    varint32: Symbol.for('vs32'),
    varint64: Symbol.for('vs64'),
    float32: Symbol.for('f32'), // non-standard
    float64: Symbol.for('f64'), // non-standard
    data: Symbol.for('data'), // non-standard
    type: Symbol.for('type'), // non-standard, signifies a varint7 type constant
    external_kind: Symbol.for('type'),
    // Instructions
    instr: Symbol.for('instr'), // non-standard
    instr_pre: Symbol.for('instr_pre'), // non-standard
    instr_pre1: Symbol.for('instr_pre1'), // non-standard
    instr_imm1: Symbol.for('instr_imm1'), // non-standard
    instr_imm1_post: Symbol.for('instr_imm1_post'), // non-standard
    instr_pre_imm: Symbol.for('instr_pre_imm'), // non-standard
    instr_pre_imm_post: Symbol.for('instr_pre_imm_post'), // non-standard
    // Cells
    module: Symbol.for('module'),
    section: Symbol.for('section'),
    import_entry: Symbol.for('import_entry'),
    export_entry: Symbol.for('export_entry'),
    local_entry: Symbol.for('local_entry'),
    func_type: Symbol.for('func_type'),
    table_type: Symbol.for('table_type'),
    memory_type: Symbol.for('memory_type'),
    global_type: Symbol.for('global_type'),
    resizable_limits: Symbol.for('resizable_limits'),
    global_variable: Symbol.for('global_variable'),
    init_expr: Symbol.for('init_expr'),
    elem_segment: Symbol.for('elem_segment'),
    data_segment: Symbol.for('data_segment'),
    function_body: Symbol.for('function_body'),
    str: Symbol.for('str'), // non-standard
};
//——————————————————————————————————————————————————————————————————————————————
// node structs
const writev = (e, objs) => objs.reduce((e, n) => n.emit(e), e);
const sumz = (n) => n.reduce((sum, ni) => sum + ni.z, 0);
class bytes_atom {
    t;
    z;
    v;
    constructor(t, v) {
        this.t = t;
        this.z = v.length;
        this.v = v;
    }
    emit(e) { return e.writeBytes(this.v); }
}
class val_atom {
    t;
    z;
    v;
    constructor(t, z, v) { this.t = t; this.z = z; this.v = v; }
    emit(e) { return e; } // override in subclasses
}
class bytesval_atom extends val_atom {
    bytes;
    constructor(t, v, bytes) {
        super(t, bytes.length, v);
        this.bytes = bytes;
    }
    emit(e) { return e.writeBytes(this.bytes); }
}
class u32_atom extends val_atom {
    constructor(v) { super(T.uint32, 4, v); }
    emit(e) { return e.writeU32(this.v); }
}
class f32_atom extends val_atom {
    constructor(v) { super(T.float32, 4, v); }
    emit(e) { return e.writeF32(this.v); }
}
class f64_atom extends val_atom {
    constructor(v) { super(T.float64, 8, v); }
    emit(e) { return e.writeF64(this.v); }
}
class u8_atom extends val_atom {
    constructor(t, v) { super(t, 1, v); }
    emit(e) { return e.writeU8(this.v); }
}
class type_atom extends u8_atom {
    b;
    constructor(v, b) { super(T.type, v); this.b = b; }
    emit(e) { return e.writeU8(this.b); }
}
exports.type_atom = type_atom;
class str_atom {
    t;
    z;
    v;
    len;
    constructor(len, v) {
        assert(len.v == v.length);
        this.t = T.str;
        this.z = len.z + v.length;
        this.v = v;
        this.len = len;
    }
    emit(e) { return this.len.emit(e).writeBytes(this.v); }
}
class cell {
    t;
    z;
    v;
    constructor(t, v) {
        this.t = t;
        this.z = sumz(v);
        this.v = v;
    }
    emit(e) { return writev(e, this.v); }
}
//—————————————————————————————————————————————
// Instructions
class instr_atom extends u8_atom {
    r;
    constructor(v, r) { super(T.instr, v); this.r = r; }
}
exports.instr_atom = instr_atom;
class instr_cell {
    t;
    z;
    v;
    r;
    constructor(t, op, r, z) {
        this.t = t;
        this.z = z;
        this.v = op;
        this.r = r;
    }
    emit(e) { return e; }
}
exports.instr_cell = instr_cell;
class instr_pre1 extends instr_cell {
    pre;
    constructor(op, r, pre) {
        super(T.instr_pre1, op, r, 1 + pre.z);
        this.pre = pre;
    }
    emit(e) { return this.pre.emit(e).writeU8(this.v); }
}
exports.instr_pre1 = instr_pre1;
class instr_imm1 extends instr_cell {
    imm;
    constructor(op, r, imm) {
        super(T.instr_imm1, op, r, 1 + imm.z);
        this.imm = imm;
    }
    emit(e) { return this.imm.emit(e.writeU8(this.v)); }
}
exports.instr_imm1 = instr_imm1;
class instr_pre extends instr_cell {
    pre;
    constructor(op, r, pre) {
        super(T.instr_pre, op, r, 1 + sumz(pre));
        this.pre = pre;
    }
    emit(e) { return writev(e, this.pre).writeU8(this.v); }
}
exports.instr_pre = instr_pre;
class instr_imm1_post extends instr_cell {
    imm;
    post;
    constructor(op, r, imm, post) {
        super(T.instr_imm1_post, op, r, 1 + imm.z + sumz(post));
        this.imm = imm;
        this.post = post;
    }
    emit(e) { return writev(this.imm.emit(e.writeU8(this.v)), this.post); }
}
exports.instr_imm1_post = instr_imm1_post;
class instr_pre_imm extends instr_cell {
    pre;
    imm;
    constructor(op, r, pre, imm) {
        super(T.instr_pre_imm, op, r, 1 + sumz(pre) + sumz(imm));
        this.pre = pre;
        this.imm = imm;
    }
    emit(e) { return writev(writev(e, this.pre).writeU8(this.v), this.imm); }
}
exports.instr_pre_imm = instr_pre_imm;
class instr_pre_imm_post extends instr_cell {
    pre;
    imm;
    post;
    constructor(op, r, pre, imm, post) {
        super(T.instr_pre_imm_post, op, r, 1 + sumz(pre) + sumz(imm) + sumz(post));
        this.pre = pre;
        this.imm = imm;
        this.post = post;
    }
    emit(e) {
        return writev(writev(writev(e, this.pre).writeU8(this.v), this.imm), this.post);
    }
}
exports.instr_pre_imm_post = instr_pre_imm_post;
function maprange(start, stop, fn) {
    const a = [];
    while (start < stop) {
        let v = fn(start);
        if (v)
            a.push(v);
        start++;
    }
    return a;
}
//——————————————————————————————————————————————————————————————————————————————
// constructors
const uint8Cache = maprange(0, 16, v => new u8_atom(T.uint8, v));
const varUint7Cache = maprange(0, 16, v => new u8_atom(T.varuint7, v));
const varUint32Cache = maprange(0, 16, v => new u8_atom(T.varuint32, v));
const varuint1_0 = new u8_atom(T.varuint1, 0);
const varuint1_1 = new u8_atom(T.varuint1, 1);
function uint8(v) {
    return uint8Cache[v] || new u8_atom(T.uint8, v);
}
function uint32(v) { return new u32_atom(v); }
function float32(v) { return new f32_atom(v); }
function float64(v) { return new f64_atom(v); }
// LEB128-encoded variable-length integers: (N = bits)
//   unsigned range: [0, 2^N-1]
//   signed range:   [-2^(N-1), +2^(N-1)-1]
function varuint1(v) {
    return v ? varuint1_1 : varuint1_0;
}
function varuint7(v) {
    assert(v >= 0 && v <= 128);
    return varUint7Cache[v] || new u8_atom(T.varuint7, v);
}
function varuint32(value) {
    const c = varUint32Cache[value];
    if (c) {
        return c;
    }
    assert(value >= 0 && value <= 0xffffffff);
    let v = value;
    const bytes = [];
    while (v >= 0x80) {
        bytes.push((v & 0x7f) | 0x80);
        v >>>= 7;
    }
    bytes.push(v);
    return new bytesval_atom(T.varuint32, value, bytes);
}
function varint7(value) {
    assert(value >= -64 && value <= 63);
    return new u8_atom(T.varint7, value < 0 ? (128 + value) : value);
}
function encVarIntN(v) {
    // FIXME: broken for values larger than uint32
    const bytes = [];
    while (true) {
        let b = v & 0x7f;
        if (-64 <= v && v < 64) {
            bytes.push(b);
            break;
        }
        v >>= 7; // Note: sign-propagating right shift
        bytes.push(b | 0x80);
    }
    return bytes;
}
function varint32(value) {
    assert(value >= -0x80000000 && value <= 0x7fffffff);
    return new bytesval_atom(T.varint32, value, encVarIntN(value));
}
function varint64(value) {
    // Here be dragons! Not all negative 64bit numbers can be represented with
    // JavaScript numbers. The ECMAScript double type has 53 bits of integer
    // precision. We thus assert this range
    assert(value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER);
    return new bytesval_atom(T.varint64, value, encVarIntN(value));
}
// Language types
const AnyFunc = new type_atom(-0x10, 0x70);
const Func = new type_atom(-0x20, 0x60);
const EmptyBlock = new type_atom(-0x40, 0x40);
const Void = EmptyBlock;
const external_kind_function = new u8_atom(T.external_kind, 0);
const external_kind_table = new u8_atom(T.external_kind, 1);
const external_kind_memory = new u8_atom(T.external_kind, 2);
const external_kind_global = new u8_atom(T.external_kind, 3);
const str = (data) => new str_atom(varuint32(data.length), data);
const sect_id_custom = varuint7(0);
const sect_id_type = varuint7(1);
const sect_id_import = varuint7(2);
const sect_id_function = varuint7(3);
const sect_id_table = varuint7(4);
const sect_id_memory = varuint7(5);
const sect_id_global = varuint7(6);
const sect_id_export = varuint7(7);
const sect_id_start = varuint7(8);
const sect_id_element = varuint7(9);
const sect_id_code = varuint7(10);
const sect_id_data = varuint7(11);
exports.sect_id = {
    custom: sect_id_custom,
    type: sect_id_type,
    import: sect_id_import,
    function: sect_id_function,
    table: sect_id_table,
    memory: sect_id_memory,
    global: sect_id_global,
    export: sect_id_export,
    start: sect_id_start,
    element: sect_id_element,
    code: sect_id_code,
    data: sect_id_data,
};
function section(id, imm, payload) {
    return new cell(T.section, [id, varuint32(imm.z + sumz(payload)), imm, ...payload]);
}
const memload = (op, r, mi, addr) => new instr_pre_imm(op, r, [addr], mi);
const memstore = (op, mi, addr, v) => new instr_pre_imm(op, Void, [addr, v], mi);
// memAddrIsAligned returns true if the memory operation will actually be aligned.
// Note: natAl and al should be encoded as log2(bits), i.e. 32bit = 2
const addrIsAligned = (natAl, al, offs, addr) => al <= natAl &&
    ((addr + offs) % [1, 2, 4, 8][al]) == 0;
class i32ops extends type_atom {
    _I32;
    // Constants
    constv(v) { return new instr_imm1(0x41, this, v); }
    const(v) { return this.constv(varint32(v)); }
    // Memory
    load(mi, addr) { return memload(0x28, this, mi, addr); }
    load8_s(mi, addr) { return memload(0x2c, this, mi, addr); }
    load8_u(mi, addr) { return memload(0x2d, this, mi, addr); }
    load16_s(mi, addr) { return memload(0x2e, this, mi, addr); }
    load16_u(mi, addr) { return memload(0x2f, this, mi, addr); }
    store(mi, addr, v) { return memstore(0x36, mi, addr, v); }
    store8(mi, addr, v) { return memstore(0x3a, mi, addr, v); }
    store16(mi, addr, v) { return memstore(0x3b, mi, addr, v); }
    addrIsAligned(mi, addr) { return addrIsAligned(2, mi[0].v, mi[1].v, addr); }
    // Comparison
    eqz(a) { return new instr_pre1(0x45, this, a); }
    eq(a, b) { return new instr_pre(0x46, this, [a, b]); }
    ne(a, b) { return new instr_pre(0x47, this, [a, b]); }
    lt_s(a, b) { return new instr_pre(0x48, this, [a, b]); }
    lt_u(a, b) { return new instr_pre(0x49, this, [a, b]); }
    gt_s(a, b) { return new instr_pre(0x4a, this, [a, b]); }
    gt_u(a, b) { return new instr_pre(0x4b, this, [a, b]); }
    le_s(a, b) { return new instr_pre(0x4c, this, [a, b]); }
    le_u(a, b) { return new instr_pre(0x4d, this, [a, b]); }
    ge_s(a, b) { return new instr_pre(0x4e, this, [a, b]); }
    ge_u(a, b) { return new instr_pre(0x4f, this, [a, b]); }
    // Numeric
    clz(a) { return new instr_pre1(0x67, this, a); }
    ctz(a) { return new instr_pre1(0x68, this, a); }
    popcnt(a) { return new instr_pre1(0x69, this, a); }
    add(a, b) { return new instr_pre(0x6a, this, [a, b]); }
    sub(a, b) { return new instr_pre(0x6b, this, [a, b]); }
    mul(a, b) { return new instr_pre(0x6c, this, [a, b]); }
    div_s(a, b) { return new instr_pre(0x6d, this, [a, b]); }
    div_u(a, b) { return new instr_pre(0x6e, this, [a, b]); }
    rem_s(a, b) { return new instr_pre(0x6f, this, [a, b]); }
    rem_u(a, b) { return new instr_pre(0x70, this, [a, b]); }
    and(a, b) { return new instr_pre(0x71, this, [a, b]); }
    or(a, b) { return new instr_pre(0x72, this, [a, b]); }
    xor(a, b) { return new instr_pre(0x73, this, [a, b]); }
    shl(a, b) { return new instr_pre(0x74, this, [a, b]); }
    shr_s(a, b) { return new instr_pre(0x75, this, [a, b]); }
    shr_u(a, b) { return new instr_pre(0x76, this, [a, b]); }
    rotl(a, b) { return new instr_pre(0x77, this, [a, b]); }
    rotr(a, b) { return new instr_pre(0x78, this, [a, b]); }
    // Conversion
    wrap_i64(a) { return new instr_pre1(0xa7, this, a); }
    trunc_s_f32(a) { return new instr_pre1(0xa8, this, a); }
    trunc_u_f32(a) { return new instr_pre1(0xa9, this, a); }
    trunc_s_f64(a) { return new instr_pre1(0xaa, this, a); }
    trunc_u_f64(a) { return new instr_pre1(0xab, this, a); }
    reinterpret_f32(a) { return new instr_pre1(0xbc, this, a); }
}
class i64ops extends type_atom {
    _I64;
    // Constants
    constv(v) { return new instr_imm1(0x42, this, v); }
    const(v) { return this.constv(varint64(v)); }
    // Memory
    load(mi, addr) { return memload(0x29, this, mi, addr); }
    load8_s(mi, addr) { return memload(0x30, this, mi, addr); }
    load8_u(mi, addr) { return memload(0x31, this, mi, addr); }
    load16_s(mi, addr) { return memload(0x32, this, mi, addr); }
    load16_u(mi, addr) { return memload(0x33, this, mi, addr); }
    load32_s(mi, addr) { return memload(0x34, this, mi, addr); }
    load32_u(mi, addr) { return memload(0x35, this, mi, addr); }
    store(mi, addr, v) { return memstore(0x37, mi, addr, v); }
    store8(mi, addr, v) { return memstore(0x3c, mi, addr, v); }
    store16(mi, addr, v) { return memstore(0x3d, mi, addr, v); }
    store32(mi, addr, v) { return memstore(0x3e, mi, addr, v); }
    addrIsAligned(mi, addr) { return addrIsAligned(3, mi[0].v, mi[1].v, addr); }
    // Comparison
    eqz(a) { return new instr_pre1(0x50, this, a); }
    eq(a, b) { return new instr_pre(0x51, this, [a, b]); }
    ne(a, b) { return new instr_pre(0x52, this, [a, b]); }
    lt_s(a, b) { return new instr_pre(0x53, this, [a, b]); }
    lt_u(a, b) { return new instr_pre(0x54, this, [a, b]); }
    gt_s(a, b) { return new instr_pre(0x55, this, [a, b]); }
    gt_u(a, b) { return new instr_pre(0x56, this, [a, b]); }
    le_s(a, b) { return new instr_pre(0x57, this, [a, b]); }
    le_u(a, b) { return new instr_pre(0x58, this, [a, b]); }
    ge_s(a, b) { return new instr_pre(0x59, this, [a, b]); }
    ge_u(a, b) { return new instr_pre(0x5a, this, [a, b]); }
    // Numeric
    clz(a) { return new instr_pre1(0x79, this, a); }
    ctz(a) { return new instr_pre1(0x7a, this, a); }
    popcnt(a) { return new instr_pre1(0x7b, this, a); }
    add(a, b) { return new instr_pre(0x7c, this, [a, b]); }
    sub(a, b) { return new instr_pre(0x7d, this, [a, b]); }
    mul(a, b) { return new instr_pre(0x7e, this, [a, b]); }
    div_s(a, b) { return new instr_pre(0x7f, this, [a, b]); }
    div_u(a, b) { return new instr_pre(0x80, this, [a, b]); }
    rem_s(a, b) { return new instr_pre(0x81, this, [a, b]); }
    rem_u(a, b) { return new instr_pre(0x82, this, [a, b]); }
    and(a, b) { return new instr_pre(0x83, this, [a, b]); }
    or(a, b) { return new instr_pre(0x84, this, [a, b]); }
    xor(a, b) { return new instr_pre(0x85, this, [a, b]); }
    shl(a, b) { return new instr_pre(0x86, this, [a, b]); }
    shr_s(a, b) { return new instr_pre(0x87, this, [a, b]); }
    shr_u(a, b) { return new instr_pre(0x88, this, [a, b]); }
    rotl(a, b) { return new instr_pre(0x89, this, [a, b]); }
    rotr(a, b) { return new instr_pre(0x8a, this, [a, b]); }
    // Conversions
    extend_s_i32(a) { return new instr_pre1(0xac, this, a); }
    extend_u_i32(a) { return new instr_pre1(0xad, this, a); }
    trunc_s_f32(a) { return new instr_pre1(0xae, this, a); }
    trunc_u_f32(a) { return new instr_pre1(0xaf, this, a); }
    trunc_s_f64(a) { return new instr_pre1(0xb0, this, a); }
    trunc_u_f64(a) { return new instr_pre1(0xb1, this, a); }
    reinterpret_f64(a) { return new instr_pre1(0xbd, this, a); }
}
class f32ops extends type_atom {
    _F32;
    // Constants
    constv(v) { return new instr_imm1(0x43, this, v); }
    const(v) { return this.constv(float32(v)); }
    // Memory
    load(mi, addr) { return memload(0x2a, this, mi, addr); }
    store(mi, addr, v) { return memstore(0x38, mi, addr, v); }
    addrIsAligned(mi, addr) { return addrIsAligned(2, mi[0].v, mi[1].v, addr); }
    // Comparison
    eq(a, b) { return new instr_pre(0x5b, this, [a, b]); }
    ne(a, b) { return new instr_pre(0x5c, this, [a, b]); }
    lt(a, b) { return new instr_pre(0x5d, this, [a, b]); }
    gt(a, b) { return new instr_pre(0x5e, this, [a, b]); }
    le(a, b) { return new instr_pre(0x5f, this, [a, b]); }
    ge(a, b) { return new instr_pre(0x60, this, [a, b]); }
    // Numeric
    abs(a) { return new instr_pre1(0x8b, this, a); }
    neg(a) { return new instr_pre1(0x8c, this, a); }
    ceil(a) { return new instr_pre1(0x8d, this, a); }
    floor(a) { return new instr_pre1(0x8e, this, a); }
    trunc(a) { return new instr_pre1(0x8f, this, a); }
    nearest(a) { return new instr_pre1(0x90, this, a); }
    sqrt(a) { return new instr_pre1(0x91, this, a); }
    add(a, b) { return new instr_pre(0x92, this, [a, b]); }
    sub(a, b) { return new instr_pre(0x93, this, [a, b]); }
    mul(a, b) { return new instr_pre(0x94, this, [a, b]); }
    div(a, b) { return new instr_pre(0x95, this, [a, b]); }
    min(a, b) { return new instr_pre(0x96, this, [a, b]); }
    max(a, b) { return new instr_pre(0x97, this, [a, b]); }
    copysign(a, b) { return new instr_pre(0x98, this, [a, b]); }
    // Conversion
    convert_s_i32(a) { return new instr_pre1(0xb2, this, a); }
    convert_u_i32(a) { return new instr_pre1(0xb3, this, a); }
    convert_s_i64(a) { return new instr_pre1(0xb4, this, a); }
    convert_u_i64(a) { return new instr_pre1(0xb5, this, a); }
    demote_f64(a) { return new instr_pre1(0xb6, this, a); }
    reinterpret_i32(a) { return new instr_pre1(0xbe, this, a); }
}
class f64ops extends type_atom {
    _F64;
    // Constants
    constv(v) { return new instr_imm1(0x44, this, v); }
    const(v) { return this.constv(float64(v)); }
    // Memory
    load(mi, addr) { return memload(0x2b, this, mi, addr); }
    store(mi, addr, v) { return memstore(0x39, mi, addr, v); }
    addrIsAligned(mi, addr) { return addrIsAligned(3, mi[0].v, mi[1].v, addr); }
    // Comparison
    eq(a, b) { return new instr_pre(0x61, this, [a, b]); }
    ne(a, b) { return new instr_pre(0x62, this, [a, b]); }
    lt(a, b) { return new instr_pre(0x63, this, [a, b]); }
    gt(a, b) { return new instr_pre(0x64, this, [a, b]); }
    le(a, b) { return new instr_pre(0x65, this, [a, b]); }
    ge(a, b) { return new instr_pre(0x66, this, [a, b]); }
    // Numeric
    abs(a) { return new instr_pre1(0x99, this, a); }
    neg(a) { return new instr_pre1(0x9a, this, a); }
    ceil(a) { return new instr_pre1(0x9b, this, a); }
    floor(a) { return new instr_pre1(0x9c, this, a); }
    trunc(a) { return new instr_pre1(0x9d, this, a); }
    nearest(a) { return new instr_pre1(0x9e, this, a); }
    sqrt(a) { return new instr_pre1(0x9f, this, a); }
    add(a, b) { return new instr_pre(0xa0, this, [a, b]); }
    sub(a, b) { return new instr_pre(0xa1, this, [a, b]); }
    mul(a, b) { return new instr_pre(0xa2, this, [a, b]); }
    div(a, b) { return new instr_pre(0xa3, this, [a, b]); }
    min(a, b) { return new instr_pre(0xa4, this, [a, b]); }
    max(a, b) { return new instr_pre(0xa5, this, [a, b]); }
    copysign(a, b) { return new instr_pre(0xa6, this, [a, b]); }
    // Conversions
    convert_s_i32(a) { return new instr_pre1(0xb7, this, a); }
    convert_u_i32(a) { return new instr_pre1(0xb8, this, a); }
    convert_s_i64(a) { return new instr_pre1(0xb9, this, a); }
    convert_u_i64(a) { return new instr_pre1(0xba, this, a); }
    promote_f32(a) { return new instr_pre1(0xbb, this, a); }
    reinterpret_i64(a) { return new instr_pre1(0xbf, this, a); }
}
const magic = uint32(0x6d736100);
const latestVersion = uint32(0x1);
const end = new instr_atom(0x0b, Void);
const elseOp = new instr_atom(0x05, Void);
function if_(r, cond, then_, else_) {
    assert(r === then_[then_.length - 1].r);
    assert(!else_ || else_.length == 0 || r === else_[else_.length - 1].r);
    return new instr_pre_imm_post(0x04, r, [cond], // pre
    [r], // imm
    // post:
    else_ ? [...then_, elseOp, ...else_, end] :
        [...then_, end]);
}
const return_ = (value) => new instr_pre1(0x0f, value.r, value);
exports.t = T;
exports.c = {
    uint8,
    uint32,
    float32,
    float64,
    varuint1,
    varuint7,
    varuint32,
    varint7,
    varint32,
    varint64,
    any_func: AnyFunc,
    func: Func,
    empty_block: EmptyBlock,
    void: Void, void_: Void,
    external_kind: {
        function: external_kind_function, // Function import or definition
        table: external_kind_table, // Table import or definition
        memory: external_kind_memory, // Memory import or definition
        global: external_kind_global, // Global import or definition
    },
    data(buf) {
        return new bytes_atom(T.data, buf);
    },
    str,
    str_ascii(text) {
        const bytes = [];
        for (let i = 0, L = text.length; i != L; ++i) {
            bytes[i] = 0xff & text.charCodeAt(i);
        }
        return str(bytes);
    },
    str_utf8: (text) => str(utf8_1.utf8.encode(text)),
    // If you are targeting a pre-MVP version, provide the desired version number (e.g. `0xd`).
    // If not provided or falsy, the latest stable version is used.
    module(sections, version) {
        const v = version ? uint32(version) : latestVersion;
        return new cell(T.module, [magic, v, ...sections]);
    },
    custom_section: (name, payload) => section(sect_id_custom, name, payload),
    type_section: (types) => section(sect_id_type, varuint32(types.length), types),
    import_section: (entries) => section(sect_id_import, varuint32(entries.length), entries),
    function_section: (types) => section(sect_id_function, varuint32(types.length), types),
    table_section: (types) => section(sect_id_table, varuint32(types.length), types),
    memory_section: (limits) => section(sect_id_memory, varuint32(limits.length), limits),
    global_section: (globals) => section(sect_id_global, varuint32(globals.length), globals),
    export_section: (exports) => section(sect_id_export, varuint32(exports.length), exports),
    start_section: (funcIndex) => section(sect_id_start, funcIndex, []),
    element_section: (entries) => section(sect_id_element, varuint32(entries.length), entries),
    code_section: (bodies) => section(sect_id_code, varuint32(bodies.length), bodies),
    data_section: (entries) => section(sect_id_data, varuint32(entries.length), entries),
    function_import_entry: (module, field, typeIndex) => new cell(T.import_entry, [
        module, field, external_kind_function, typeIndex
    ]),
    table_import_entry: (module, field, type) => new cell(T.import_entry, [module, field, external_kind_table, type]),
    memory_import_entry: (module, field, limits) => new cell(T.import_entry, [module, field, external_kind_memory, limits]),
    global_import_entry: (module, field, type) => new cell(T.import_entry, [module, field, external_kind_global, type]),
    export_entry: (field, kind, index) => new cell(T.export_entry, [field, kind, index]),
    elem_segment: (index, offset, funcIndex) => new cell(T.elem_segment, [
        index, offset, varuint32(funcIndex.length), ...funcIndex
    ]),
    data_segment: (index, offset, data) => new cell(T.data_segment, [index, offset, varuint32(data.z), data]),
    func_type(paramTypes, returnType) {
        const paramLen = varuint32(paramTypes.length);
        return new cell(T.func_type, returnType ? [Func, paramLen, ...paramTypes, varuint1_1, returnType]
            : [Func, paramLen, ...paramTypes, varuint1_0]);
    },
    table_type(type, limits) {
        assert(type.v == AnyFunc.v); // WASM MVP limitation
        return new cell(T.table_type, [type, limits]);
    },
    global_type: (contentType, mutable) => new cell(T.global_type, [
        contentType, mutable ? varuint1_1 : varuint1_0
    ]),
    // expressed in number of memory pages (not bytes; pagesize=64KiB)
    resizable_limits: (initial, maximum) => new cell(T.resizable_limits, maximum ?
        [varuint1_1, initial, maximum] : [varuint1_0, initial]),
    global_variable: (type, init) => new cell(T.global_variable, [type, init]),
    init_expr: (expr) => new cell(T.init_expr, [...expr, end]),
    function_body(locals, code) {
        const localCount = varuint32(locals.length);
        return new cell(T.function_body, [
            varuint32(localCount.z + sumz(locals) + sumz(code) + 1), // body_size
            localCount, ...locals, ...code, end
        ]);
    },
    local_entry: (count, type) => new cell(T.local_entry, [count, type]),
    // Semantics of the WebAssembly stack machine:
    // - Control instructions pop their argument value(s) off the stack, may change
    //   the program counter, and push result value(s) onto the stack.
    // - Simple instructions pop their argument value(s) from the stack, apply an
    //   operator to the values, and then push the result value(s) onto the stack,
    //   followed by an implicit advancement of the program counter.
    unreachable: new instr_atom(0x00, Void),
    nop: new instr_atom(0x01, Void),
    // begin a block which can also form CF loops
    block(r, body) {
        assert(r === body[body.length - 1].r);
        return new instr_imm1_post(0x02, r, r, [...body, end]);
    },
    void_block(body) {
        assert(body.length == 0 || Void === body[body.length - 1].r);
        return new instr_imm1_post(0x02, Void, EmptyBlock, [...body, end]);
    },
    // begin a block which can also form CF loops
    loop(r, body) {
        assert(r === body[body.length - 1].r);
        return new instr_imm1_post(0x03, r, r, [...body, end]);
    },
    void_loop(body) {
        assert(body.length == 0 || Void === body[body.length - 1].r);
        return new instr_imm1_post(0x03, Void, EmptyBlock, [...body, end]);
    },
    if: if_, if_,
    end: end,
    // Branch to a given label (relative depth) in an enclosing construct.
    // Note:
    // - "branching" to a block correspond to a "break" statement
    // - "branching" to a loop correspond to a "continue" statement
    br: (relDepth) => new instr_imm1(0x0c, Void, varuint32(relDepth)),
    // Conditionall branch to a given label in an enclosing construct.
    // When condition is false, this is equivalent to a "Nop" operation.
    // When condition is true, this is equivalent to a "Br" operation.
    br_if: (relDepth, cond) => new instr_pre_imm(0x0d, Void, [cond], [varuint32(relDepth)]),
    // Jump table which jumps to a label in an enclosing construct.
    // A br_table consists of a zero-based array of labels, a default label,
    // and an index operand. A br_table jumps to the label indexed in the
    // array or the default label if the index is out of bounds.
    br_table: (targetLabels, defaultLabel, index) => new instr_pre_imm(0x0e, Void, [index], [varuint32(targetLabels.length), ...targetLabels, defaultLabel]),
    // return zero or one value from this function
    return: return_, return_,
    return_void: new instr_atom(0x0f, Void),
    // Calling
    call(r, funcIndex, args) {
        return new instr_pre_imm(0x10, r, args, [funcIndex]);
    },
    call_indirect(r, funcIndex, args) {
        return new instr_pre_imm(0x11, r, args, [funcIndex, varuint1_0]);
    },
    // drop discards the value of its operand
    // R should be the value on the stack "under" the operand. E.g. with a stack:
    //   I32  top
    //   F64  ...
    //   F32  bottom
    // drop
    //   F64  top
    //   F32  bottom
    // i.e. R=F64
    drop(r, n) {
        return new instr_pre1(0x1a, r, n);
    },
    // select one of two values based on condition
    select(cond, trueRes, falseRes) {
        assert(trueRes.r === falseRes.r);
        return new instr_pre(0x1b, trueRes.r, [trueRes, falseRes, cond]);
    },
    // Variable access
    get_local(r, localIndex) {
        return new instr_imm1(0x20, r, varuint32(localIndex));
    },
    set_local(localIndex, expr) {
        return new instr_pre_imm(0x21, Void, [expr], [varuint32(localIndex)]);
    },
    tee_local(localIndex, expr) {
        return new instr_pre_imm(0x22, expr.r, [expr], [varuint32(localIndex)]);
    },
    get_global(r, globalIndex) {
        return new instr_imm1(0x23, r, varuint32(globalIndex));
    },
    set_global(globalIndex, expr) {
        return new instr_pre_imm(0x24, Void, [expr], [varuint32(globalIndex)]);
    },
    // Memory
    current_memory() {
        return new instr_imm1(0x3f, exports.c.i32, varuint1_0);
    },
    // Grow the size of memory by `delta` memory pages.
    // Returns the previous memory size in units of pages or -1 on failure.
    grow_memory(delta) {
        assert(delta.v >= 0);
        return new instr_pre_imm(0x40, exports.c.i32, [delta], [varuint1_0]);
    },
    // MemImm: Alignment          Offset
    align8: [varUint32Cache[0], varUint32Cache[0]],
    align16: [varUint32Cache[1], varUint32Cache[0]],
    align32: [varUint32Cache[2], varUint32Cache[0]],
    align64: [varUint32Cache[3], varUint32Cache[0]],
    i32: new i32ops(-0x01, 0x7f),
    i64: new i64ops(-0x02, 0x7e),
    f32: new f32ops(-0x03, 0x7d),
    f64: new f64ops(-0x04, 0x7c),
};
// access helpers
exports.get = {
    sections(m) {
        return m.v.slice(2); // 0=magic, 1=version, 2...=Section[]
    },
    section(m, id) {
        let ido = (typeof id != 'object') ? varuint7(id) : id;
        for (let i = 2; i < m.v.length; ++i) {
            let section = m.v[i];
            if (section.v[0] === ido) {
                return section;
            }
        }
        throw new Error(`Section ${id} not found`);
    },
    function_bodies(s) {
        return {
            [Symbol.iterator](startIndex) {
                let index = 3 + (startIndex || 0);
                return {
                    next() {
                        const funcBody = s.v[index];
                        if (!funcBody) {
                            return { done: true, value: null };
                        }
                        let localCount = funcBody.v[1];
                        return {
                            done: false,
                            value: {
                                index: index++,
                                locals: funcBody.v.slice(2, localCount.v + 2),
                                code: funcBody.v.slice(2 + localCount.v, funcBody.v.length - 1)
                                //  -1 to skip terminating `end`
                            }
                        };
                    }
                };
            }
        };
    },
};
//# sourceMappingURL=ast.js.map