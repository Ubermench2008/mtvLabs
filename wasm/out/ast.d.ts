import { Emittable, Emitter } from './emit';
import { opcodes } from './info';
export type uint1 = number;
export type uint7 = number;
export type uint8 = number;
export type uint16 = number;
export type uint32 = number;
export type int7 = number;
export type int32 = number;
export type int64 = number;
export type float32 = number;
export type float64 = number;
export type TypeTag = symbol;
export interface N extends Emittable {
    readonly t: TypeTag;
    readonly z: uint32;
    readonly v: any;
}
export interface Atom<T> extends N {
    readonly v: T;
}
export interface Cell<T extends N> extends N {
    readonly v: T[];
}
export interface Module extends Cell<Section> {
    readonly _Module: undefined;
    readonly version: uint32;
}
export type Section = CustomSection | TypeSection | ImportSection | FunctionSection | TableSection | MemorySection | GlobalSection | ExportSection | StartSection | ElementSection | CodeSection | DataSection;
export interface CustomSection extends Cell<N> {
    readonly _CustomSection: undefined;
}
export interface TypeSection extends Cell<FuncType> {
    readonly _TypeSection: undefined;
}
export interface ImportSection extends Cell<ImportEntry> {
    readonly _ImportSection: undefined;
}
export interface FunctionSection extends Cell<VarUint32> {
    readonly _FunctionSection: undefined;
}
export interface TableSection extends Cell<TableType> {
    readonly _TableSection: undefined;
}
export interface MemorySection extends Cell<ResizableLimits> {
    readonly _MemorySection: undefined;
}
export interface GlobalSection extends Cell<GlobalVariable> {
    readonly _GlobalSection: undefined;
}
export interface ExportSection extends Cell<ExportEntry> {
    readonly _ExportSection: undefined;
}
export interface StartSection extends Cell<Void> {
    readonly _StartSection: undefined;
}
export interface ElementSection extends Cell<ElemSegment> {
    readonly _ElementSection: undefined;
}
export interface CodeSection extends Cell<FunctionBody> {
    readonly _CodeSection: undefined;
}
export interface DataSection extends Cell<DataSegment> {
    readonly _DataSection: undefined;
}
export interface ImportEntry extends Cell<N> {
    readonly _ImportEntry: undefined;
}
export interface ExportEntry extends Cell<N> {
    readonly _ExportEntry: undefined;
}
export interface FuncType extends Cell<N> {
    readonly _FuncType: undefined;
}
export interface TableType extends Cell<N> {
    readonly _TableType: undefined;
}
export interface GlobalType extends Cell<N> {
    readonly _GlobalType: undefined;
}
export interface ResizableLimits extends Cell<N> {
    readonly _ResizableLimits: undefined;
}
export interface GlobalVariable extends Cell<N> {
    readonly _GlobalVariable: undefined;
}
export interface ElemSegment extends Cell<N> {
    readonly _ElemSegment: undefined;
}
export interface DataSegment extends Cell<N> {
    readonly _DataSegment: undefined;
}
export interface InitExpr extends Cell<N> {
    readonly _InitExpr: undefined;
}
export interface FunctionBody extends Cell<N> {
    readonly _FunctionBody: undefined;
}
export interface LocalEntry extends Cell<N> {
    readonly _LocalEntry: undefined;
}
export interface Str extends Atom<ArrayLike<uint8>> {
    readonly _Str: undefined;
    readonly len: VarUint32;
}
export interface Data extends Atom<ArrayLike<uint8>> {
    readonly _Data: undefined;
}
export interface Uint8 extends Atom<uint8> {
}
export interface Uint16 extends Atom<uint16> {
}
export interface Uint32 extends Atom<uint32> {
}
export interface VarUint32 extends Atom<uint32> {
}
export interface VarUint7 extends Atom<uint7> {
}
export interface VarUint1 extends Atom<uint1> {
}
export interface VarInt7 extends Atom<int7> {
}
export interface VarInt32 extends Atom<int32> {
}
export interface VarInt64 extends Atom<int64> {
}
export interface Float32 extends Atom<float32> {
}
export interface Float64 extends Atom<float64> {
}
export interface I32 extends VarInt32 {
    readonly _I32: undefined;
}
export interface I64 extends VarInt64 {
    readonly _I64: undefined;
}
export interface F32 extends Float32 {
    readonly _F32: undefined;
}
export interface F64 extends Float64 {
    readonly _F64: undefined;
}
export interface Void extends VarInt7 {
    readonly _Void: undefined;
}
export type Int = I32 | I64;
export type Result = I32 | I64 | F32 | F64;
export type AnyResult = Result | Void;
export type AnyOp = Op<AnyResult>;
export interface ValueType extends Atom<int32 | int64 | float32 | float64> {
}
type AnyFunc = VarInt7;
type ElemType = AnyFunc;
type ExternalKind = Uint8;
export type MemImm = [
    flags: VarUint32,
    offset: Int
];
export type OpCode = keyof typeof opcodes;
export interface Op<R> extends N {
    readonly _Op: R;
    readonly r: AnyResult;
    readonly v: OpCode;
    readonly pre?: N[] | N;
    readonly imm?: N[] | N;
    readonly post?: N[];
}
export interface NumOps<R extends Result> {
    const(v: number): Op<R>;
    load(mi: MemImm, addr: Op<Int>): Op<R>;
    store(mi: MemImm, addr: Op<Int>, v: Op<R>): Op<Void>;
    addrIsAligned(mi: MemImm, addr: number): boolean;
    eq(a: Op<R>, b: Op<R>): Op<I32>;
    ne(a: Op<R>, b: Op<R>): Op<I32>;
    add(a: Op<R>, b: Op<R>): Op<R>;
    sub(a: Op<R>, b: Op<R>): Op<R>;
    mul(a: Op<R>, b: Op<R>): Op<R>;
}
export interface IntOps<R extends Result> extends NumOps<R> {
    load8_s(mi: MemImm, addr: Op<Int>): Op<R>;
    load8_u(mi: MemImm, addr: Op<Int>): Op<R>;
    load16_s(mi: MemImm, addr: Op<Int>): Op<R>;
    load16_u(mi: MemImm, addr: Op<Int>): Op<R>;
    store8(mi: MemImm, addr: Op<Int>, v: Op<R>): Op<Void>;
    store16(mi: MemImm, addr: Op<Int>, v: Op<R>): Op<Void>;
    eqz(a: Op<R>): Op<I32>;
    lt_s(a: Op<R>, b: Op<R>): Op<I32>;
    lt_u(a: Op<R>, b: Op<R>): Op<I32>;
    gt_s(a: Op<R>, b: Op<R>): Op<I32>;
    gt_u(a: Op<R>, b: Op<R>): Op<I32>;
    le_s(a: Op<R>, b: Op<R>): Op<I32>;
    le_u(a: Op<R>, b: Op<R>): Op<I32>;
    ge_s(a: Op<R>, b: Op<R>): Op<I32>;
    ge_u(a: Op<R>, b: Op<R>): Op<I32>;
    clz(a: Op<R>): Op<R>;
    ctz(a: Op<R>): Op<R>;
    popcnt(a: Op<R>): Op<R>;
    add(a: Op<R>, b: Op<R>): Op<R>;
    sub(a: Op<R>, b: Op<R>): Op<R>;
    mul(a: Op<R>, b: Op<R>): Op<R>;
    div_s(a: Op<R>, b: Op<R>): Op<R>;
    div_u(a: Op<R>, b: Op<R>): Op<R>;
    rem_s(a: Op<R>, b: Op<R>): Op<R>;
    rem_u(a: Op<R>, b: Op<R>): Op<R>;
    and(a: Op<R>, b: Op<R>): Op<R>;
    or(a: Op<R>, b: Op<R>): Op<R>;
    xor(a: Op<R>, b: Op<R>): Op<R>;
    shl(a: Op<R>, b: Op<R>): Op<R>;
    shr_s(a: Op<R>, b: Op<R>): Op<R>;
    shr_u(a: Op<R>, b: Op<R>): Op<R>;
    rotl(a: Op<R>, b: Op<R>): Op<R>;
    rotr(a: Op<R>, b: Op<R>): Op<R>;
    trunc_s_f32(a: Op<F32>): Op<R>;
    trunc_u_f32(a: Op<F32>): Op<R>;
    trunc_s_f64(a: Op<F64>): Op<R>;
    trunc_u_f64(a: Op<F64>): Op<R>;
}
export interface FloatOps<R extends Result> extends NumOps<R> {
    eq(a: Op<R>, b: Op<R>): Op<I32>;
    ne(a: Op<R>, b: Op<R>): Op<I32>;
    lt(a: Op<R>, b: Op<R>): Op<I32>;
    gt(a: Op<R>, b: Op<R>): Op<I32>;
    le(a: Op<R>, b: Op<R>): Op<I32>;
    ge(a: Op<R>, b: Op<R>): Op<I32>;
    add(a: Op<R>, b: Op<R>): Op<R>;
    sub(a: Op<R>, b: Op<R>): Op<R>;
    mul(a: Op<R>, b: Op<R>): Op<R>;
    abs(a: Op<R>): Op<R>;
    neg(a: Op<R>): Op<R>;
    ceil(a: Op<R>): Op<R>;
    floor(a: Op<R>): Op<R>;
    trunc(a: Op<R>): Op<R>;
    nearest(a: Op<R>): Op<R>;
    sqrt(a: Op<R>): Op<R>;
    div(a: Op<R>, b: Op<R>): Op<R>;
    min(a: Op<R>, b: Op<R>): Op<R>;
    max(a: Op<R>, b: Op<R>): Op<R>;
    copysign(a: Op<R>, b: Op<R>): Op<R>;
    convert_s_i32(a: Op<I32>): Op<R>;
    convert_u_i32(a: Op<I32>): Op<R>;
    convert_s_i64(a: Op<I64>): Op<R>;
    convert_u_i64(a: Op<I64>): Op<R>;
}
export interface I32ops extends I32, IntOps<I32> {
    constv(v: VarInt32): Op<I32>;
    const(v: int32): Op<I32>;
    wrap_i64(a: Op<I64>): Op<I32>;
    reinterpret_f32(a: Op<F32>): Op<I32>;
}
export interface I64ops extends I64, IntOps<I64> {
    constv(v: VarInt64): Op<I64>;
    const(v: int64): Op<I64>;
    load32_s(mi: MemImm, addr: Op<Int>): Op<I64>;
    load32_u(mi: MemImm, addr: Op<Int>): Op<I64>;
    store32(mi: MemImm, addr: Op<Int>, v: Op<Result>): Op<Void>;
    extend_s_i32(a: Op<I32>): Op<I64>;
    extend_u_i32(a: Op<I32>): Op<I64>;
    reinterpret_f64(a: Op<F64>): Op<I64>;
}
export interface F32ops extends F32, FloatOps<F32> {
    constv(v: Float32): Op<F32>;
    const(v: float32): Op<F32>;
    demote_f64(a: Op<F64>): Op<F32>;
    reinterpret_i32(a: Op<I32>): Op<F32>;
}
export interface F64ops extends F64, FloatOps<F64> {
    constv(v: Float64): Op<F64>;
    const(v: float64): Op<F64>;
    promote_f32(a: Op<F32>): Op<F64>;
    reinterpret_i64(a: Op<I64>): Op<F64>;
}
declare class val_atom<T> implements Atom<T> {
    readonly t: TypeTag;
    readonly z: uint32;
    readonly v: T;
    constructor(t: TypeTag, z: uint32, v: T);
    emit(e: Emitter): Emitter;
}
declare class u8_atom<T extends number> extends val_atom<T> {
    constructor(t: TypeTag, v: T);
    emit(e: Emitter): Emitter;
}
export declare class type_atom extends u8_atom<int7> {
    readonly b: uint8;
    constructor(v: int7, b: uint8);
    emit(e: Emitter): Emitter;
}
export declare class instr_atom extends u8_atom<OpCode> {
    readonly r: AnyResult;
    constructor(v: OpCode, r: AnyResult);
}
export declare class instr_cell implements N {
    readonly t: TypeTag;
    readonly z: uint32;
    readonly v: OpCode;
    readonly r: AnyResult;
    constructor(t: TypeTag, op: OpCode, r: AnyResult, z: uint32);
    emit(e: Emitter): Emitter;
}
export declare class instr_pre1 extends instr_cell {
    readonly pre: N;
    constructor(op: OpCode, r: AnyResult, pre: N);
    emit(e: Emitter): Emitter;
}
export declare class instr_imm1 extends instr_cell {
    readonly imm: N;
    constructor(op: OpCode, r: AnyResult, imm: N);
    emit(e: Emitter): Emitter;
}
export declare class instr_pre extends instr_cell {
    readonly pre: N[];
    constructor(op: OpCode, r: AnyResult, pre: N[]);
    emit(e: Emitter): Emitter;
}
export declare class instr_imm1_post extends instr_cell {
    readonly imm: N;
    readonly post: N[];
    constructor(op: OpCode, r: AnyResult, imm: N, post: N[]);
    emit(e: Emitter): Emitter;
}
export declare class instr_pre_imm extends instr_cell {
    readonly pre: N[];
    readonly imm: N[];
    constructor(op: OpCode, r: AnyResult, pre: N[], imm: N[]);
    emit(e: Emitter): Emitter;
}
export declare class instr_pre_imm_post extends instr_cell {
    readonly pre: N[];
    readonly imm: N[];
    readonly post: N[];
    constructor(op: OpCode, r: AnyResult, pre: N[], imm: N[], post: N[]);
    emit(e: Emitter): Emitter;
}
declare function uint8(v: uint8): Uint8;
declare function uint32(v: uint32): Uint32;
declare function float32(v: float32): Float32;
declare function float64(v: float64): Float64;
declare function varuint1(v: any): Atom<number>;
declare function varuint7(v: uint7): VarUint7;
declare function varuint32(value: uint32): VarUint32;
declare function varint7(value: int7): VarInt7;
declare function varint32(value: int32): VarInt32;
declare function varint64(value: int64): VarInt64;
declare const AnyFunc: AnyFunc;
export declare const sect_id: {
    custom: VarUint7;
    type: VarUint7;
    import: VarUint7;
    function: VarUint7;
    table: VarUint7;
    memory: VarUint7;
    global: VarUint7;
    export: VarUint7;
    start: VarUint7;
    element: VarUint7;
    code: VarUint7;
    data: VarUint7;
};
declare function if_<R extends AnyResult>(r: R, cond: Op<I32>, then_: AnyOp[], else_?: AnyOp[]): Op<R>;
export declare const t: {
    readonly uint8: symbol;
    readonly uint16: symbol;
    readonly uint32: symbol;
    readonly varuint1: symbol;
    readonly varuint7: symbol;
    readonly varuint32: symbol;
    readonly varint7: symbol;
    readonly varint32: symbol;
    readonly varint64: symbol;
    readonly float32: symbol;
    readonly float64: symbol;
    readonly data: symbol;
    readonly type: symbol;
    readonly external_kind: symbol;
    readonly instr: symbol;
    readonly instr_pre: symbol;
    readonly instr_pre1: symbol;
    readonly instr_imm1: symbol;
    readonly instr_imm1_post: symbol;
    readonly instr_pre_imm: symbol;
    readonly instr_pre_imm_post: symbol;
    readonly module: symbol;
    readonly section: symbol;
    readonly import_entry: symbol;
    readonly export_entry: symbol;
    readonly local_entry: symbol;
    readonly func_type: symbol;
    readonly table_type: symbol;
    readonly memory_type: symbol;
    readonly global_type: symbol;
    readonly resizable_limits: symbol;
    readonly global_variable: symbol;
    readonly init_expr: symbol;
    readonly elem_segment: symbol;
    readonly data_segment: symbol;
    readonly function_body: symbol;
    readonly str: symbol;
};
export declare const c: {
    readonly uint8: typeof uint8;
    readonly uint32: typeof uint32;
    readonly float32: typeof float32;
    readonly float64: typeof float64;
    readonly varuint1: typeof varuint1;
    readonly varuint7: typeof varuint7;
    readonly varuint32: typeof varuint32;
    readonly varint7: typeof varint7;
    readonly varint32: typeof varint32;
    readonly varint64: typeof varint64;
    readonly any_func: VarInt7;
    readonly func: VarInt7;
    readonly empty_block: VarInt7;
    readonly void: Void;
    readonly void_: Void;
    readonly external_kind: {
        readonly function: Uint8;
        readonly table: Uint8;
        readonly memory: Uint8;
        readonly global: Uint8;
    };
    readonly data: (buf: ArrayLike<uint8>) => Data;
    readonly str: (data: ArrayLike<uint8>) => Str;
    readonly str_ascii: (text: string) => Str;
    readonly str_utf8: (text: string) => Str;
    readonly module: (sections: Section[], version?: uint32) => Module;
    readonly custom_section: (name: Str, payload: N[]) => CustomSection;
    readonly type_section: (types: FuncType[]) => TypeSection;
    readonly import_section: (entries: ImportEntry[]) => ImportSection;
    readonly function_section: (types: VarUint32[]) => FunctionSection;
    readonly table_section: (types: TableType[]) => TableSection;
    readonly memory_section: (limits: ResizableLimits[]) => MemorySection;
    readonly global_section: (globals: GlobalVariable[]) => GlobalSection;
    readonly export_section: (exports: ExportEntry[]) => ExportSection;
    readonly start_section: (funcIndex: VarUint32) => StartSection;
    readonly element_section: (entries: ElemSegment[]) => ElementSection;
    readonly code_section: (bodies: FunctionBody[]) => CodeSection;
    readonly data_section: (entries: DataSegment[]) => DataSection;
    readonly function_import_entry: (module: Str, field: Str, typeIndex: VarUint32) => ImportEntry;
    readonly table_import_entry: (module: Str, field: Str, type: TableType) => ImportEntry;
    readonly memory_import_entry: (module: Str, field: Str, limits: ResizableLimits) => ImportEntry;
    readonly global_import_entry: (module: Str, field: Str, type: GlobalType) => ImportEntry;
    readonly export_entry: (field: Str, kind: ExternalKind, index: VarUint32) => ExportEntry;
    readonly elem_segment: (index: VarUint32, offset: InitExpr, funcIndex: VarUint32[]) => ElemSegment;
    readonly data_segment: (index: VarUint32, offset: InitExpr, data: Data) => DataSegment;
    readonly func_type: (paramTypes: ValueType[], returnType?: ValueType | null) => FuncType;
    readonly table_type: (type: ElemType, limits: ResizableLimits) => TableType;
    readonly global_type: (contentType: ValueType, mutable?: boolean) => GlobalType;
    readonly resizable_limits: (initial: VarUint32, maximum?: VarUint32) => ResizableLimits;
    readonly global_variable: (type: GlobalType, init: InitExpr) => GlobalVariable;
    readonly init_expr: (expr: N[]) => InitExpr;
    readonly function_body: (locals: LocalEntry[], code: N[]) => FunctionBody;
    readonly local_entry: (count: VarUint32, type: ValueType) => LocalEntry;
    readonly unreachable: Op<Void>;
    readonly nop: Op<Void>;
    readonly block: <R extends AnyResult>(r: R, body: AnyOp[]) => Op<R>;
    readonly void_block: (body: AnyOp[]) => Op<Void>;
    readonly loop: <R extends AnyResult>(r: R, body: AnyOp[]) => Op<R>;
    readonly void_loop: (body: AnyOp[]) => Op<Void>;
    readonly if: typeof if_;
    readonly if_: typeof if_;
    readonly end: Op<Void>;
    readonly br: (relDepth: uint32) => Op<Void>;
    readonly br_if: (relDepth: uint32, cond: Op<I32>) => Op<Void>;
    readonly br_table: (targetLabels: VarUint32[], defaultLabel: VarUint32, index: AnyOp) => Op<Void>;
    readonly return: <R extends Result>(value: Op<R>) => Op<R>;
    readonly return_: <R extends Result>(value: Op<R>) => Op<R>;
    readonly return_void: Op<Void>;
    readonly call: <R extends Result>(r: R, funcIndex: VarUint32, args: AnyOp[]) => Op<R>;
    readonly call_indirect: <R extends Result>(r: R, funcIndex: VarUint32, args: AnyOp[]) => Op<R>;
    readonly drop: <R extends AnyResult>(r: R, n: Op<Result>) => Op<R>;
    readonly select: <R extends Result>(cond: Op<I32>, trueRes: Op<R>, falseRes: Op<R>) => Op<R>;
    readonly get_local: <R extends Result>(r: R, localIndex: uint32) => Op<R>;
    readonly set_local: (localIndex: uint32, expr: Op<Result>) => Op<Void>;
    readonly tee_local: <R extends Result>(localIndex: uint32, expr: Op<R>) => Op<R>;
    readonly get_global: <R extends Result>(r: R, globalIndex: uint32) => Op<R>;
    readonly set_global: (globalIndex: uint32, expr: Op<Result>) => Op<Void>;
    readonly current_memory: () => Op<Int>;
    readonly grow_memory: (delta: Op<Int>) => Op<Int>;
    readonly align8: [VarUint32, Int];
    readonly align16: [VarUint32, Int];
    readonly align32: [VarUint32, Int];
    readonly align64: [VarUint32, Int];
    readonly i32: I32ops;
    readonly i64: I64ops;
    readonly f32: F32ops;
    readonly f64: F64ops;
};
export interface FunctionBodyInfo {
    index: number;
    locals: N[];
    code: AnyOp[];
}
export declare const get: {
    readonly sections: (m: Module) => Section[];
    readonly section: (m: Module, id: VarUint7 | uint7) => Section;
    readonly function_bodies: (s: CodeSection) => Iterable<FunctionBodyInfo>;
};
export {};
