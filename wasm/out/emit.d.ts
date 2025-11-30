import { uint8, uint16, uint32, float32, float64 } from './basic-types';
export interface Emitter {
    writeU8(v: uint8): Emitter;
    writeU16(v: uint16): Emitter;
    writeU32(v: uint32): Emitter;
    writeF32(v: float32): Emitter;
    writeF64(v: float64): Emitter;
    writeBytes(v: ArrayLike<uint8>): Emitter;
}
export interface Emittable {
    emit(ctx: Emitter): Emitter;
}
export declare class BufferedEmitter implements Emitter {
    readonly buffer: ArrayBuffer;
    readonly view: DataView;
    length: uint32;
    constructor(buffer: ArrayBuffer);
    writeU8(v: uint8): Emitter;
    writeU16(v: uint16): Emitter;
    writeU32(v: uint32): Emitter;
    writeF32(v: float32): Emitter;
    writeF64(v: float64): Emitter;
    writeBytes(bytes: ArrayLike<uint8>): this;
}
