"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utf8 = void 0;
const buffer_1 = require("buffer");
// ——————————————————————————————————————————————————————————————————————————
exports.utf8 = typeof TextEncoder != 'undefined' ? (function () {
    // Modern browsers
    const enc = new TextEncoder('utf-8');
    const dec = new TextDecoder('utf-8');
    return {
        encode(text) {
            return enc.encode(text);
        },
        decode(b) {
            return dec.decode(b.buffer != undefined ? b :
                new Uint8Array(b));
        },
    };
})() : typeof buffer_1.Buffer != 'undefined' ? {
    // Nodejs
    encode(text) {
        return new Uint8Array(buffer_1.Buffer.from(text, 'utf-8'));
    },
    decode(b) {
        return (b.buffer != undefined ?
            buffer_1.Buffer.from(b.buffer, b.byteOffset, b.byteLength) :
            buffer_1.Buffer.from(b)).toString('utf8');
    }
} : {
    // Some other pesky JS environment
    encode(text) {
        let asciiBytes = [];
        for (let i = 0, L = text.length; i != L; ++i) {
            asciiBytes[i] = 0xff & text.charCodeAt(i);
        }
        return new Uint8Array(asciiBytes);
    },
    decode(buf) {
        return '';
    }
};
//# sourceMappingURL=utf8.js.map