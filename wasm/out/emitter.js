"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferedEmitter = void 0;
// Emitter that writes to an ArrayBuffer
class BufferedEmitter {
    buffer;
    view;
    length;
    constructor(buffer) {
        this.buffer = buffer;
        this.view = new DataView(this.buffer);
        this.length = 0;
    }
    writeU8(v) {
        this.view.setUint8(this.length++, v);
        return this;
    }
    writeU16(v) {
        this.view.setUint16(this.length, v, true);
        this.length += 2;
        return this;
    }
    writeU32(v) {
        this.view.setUint32(this.length, v, true);
        this.length += 4;
        return this;
    }
    writeF32(v) {
        this.view.setFloat32(this.length, v, true);
        this.length += 4;
        return this;
    }
    writeF64(v) {
        this.view.setFloat64(this.length, v, true);
        this.length += 8;
        return this;
    }
    writeBytes(bytes) {
        for (let i = 0, L = bytes.length; i != L; ++i) {
            this.view.setUint8(this.length++, bytes[i]);
        }
        return this;
    }
}
exports.BufferedEmitter = BufferedEmitter;
// Note: you can use repr.reprBuffer(ArrayBuffer, Writer)
// to print an ASCII representation of a buffer.
//# sourceMappingURL=emitter.js.map