"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsignedLEB128 = exports.signedLEB128 = exports.encodeString = exports.ieee754 = void 0;
const ieee754 = (n) => {
    const buf = Buffer.allocUnsafe(4);
    buf.writeFloatLE(n, 0);
    return Uint8Array.from(buf);
};
exports.ieee754 = ieee754;
const encodeString = (str) => [
    str.length,
    ...str.split("").map(s => s.charCodeAt(0))
];
exports.encodeString = encodeString;
const signedLEB128 = (n) => {
    const buffer = [];
    let more = true;
    const isNegative = n < 0;
    const bitCount = Math.ceil(Math.log2(Math.abs(n))) + 1;
    while (more) {
        let byte = n & 0x7f;
        n >>= 7;
        if (isNegative) {
            n = n | -(1 << (bitCount - 8));
        }
        if ((n === 0 && (byte & 0x40) === 0) || (n === -1 && (byte & 0x40) !== 0x40)) {
            more = false;
        }
        else {
            byte |= 0x80;
        }
        buffer.push(byte);
    }
    return buffer;
};
exports.signedLEB128 = signedLEB128;
const unsignedLEB128 = (n) => {
    const buffer = [];
    do {
        let byte = n & 0x7f;
        n >>>= 7;
        if (n !== 0) {
            byte |= 0x80;
        }
        buffer.push(byte);
    } while (n !== 0);
    return buffer;
};
exports.unsignedLEB128 = unsignedLEB128;
//# sourceMappingURL=encoding.js.map