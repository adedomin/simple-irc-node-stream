// Copyright (C) 2021  Anthony DeDominic <adedomin@gmail.com>
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
'use strict';
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRNG = void 0;
// Based on http://burtleburtle.net/bob/rand/smallprng.html
// 32bit JS PRNG
class PRNG {
    constructor(seed = 0x12345678) {
        _a.set(this, void 0);
        _b.set(this, void 0);
        _c.set(this, void 0);
        _d.set(this, void 0);
        __classPrivateFieldSet(this, _a, 0xf1ea5eed);
        __classPrivateFieldSet(this, _b, seed);
        __classPrivateFieldSet(this, _c, seed);
        __classPrivateFieldSet(this, _d, seed);
        // init generator
        for (let i = 0; i < 20; ++i)
            this.nextRand();
    }
    nextRand() {
        const e = __classPrivateFieldGet(this, _a) - ((__classPrivateFieldGet(this, _b) << 27) | (__classPrivateFieldGet(this, _b) >> 5));
        __classPrivateFieldSet(this, _a, __classPrivateFieldGet(this, _b) ^ ((__classPrivateFieldGet(this, _c) << 17) | (__classPrivateFieldGet(this, _b) >> 15)));
        __classPrivateFieldSet(this, _b, __classPrivateFieldGet(this, _c) + __classPrivateFieldGet(this, _d));
        __classPrivateFieldSet(this, _c, __classPrivateFieldGet(this, _d) + e);
        __classPrivateFieldSet(this, _d, e + __classPrivateFieldGet(this, _a));
        return __classPrivateFieldGet(this, _d);
    }
    choose(choices) {
        if (choices.length < 1)
            throw new Error('Choices must contain at least 1 choice.');
        const max = choices.reduce((acc, { weight }) => acc + weight, 0);
        const maxPow2 = Math.ceil(Math.sqrt(max)) ** 2;
        // Account for modulo bias
        let pick;
        do {
            // random has to be positive;
            pick = (this.nextRand() >>> 0) % maxPow2;
        } while (pick >= max);
        let acc = 0;
        return choices.find(({ weight }) => {
            if (pick >= acc && pick < (acc + weight))
                return true;
            acc += weight;
            return false;
        })?.value;
    }
    getRandomAlphaNum(len) {
        // 64 chars (not base64)
        const values = '-_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return [...this.take(len ?? 8)]
            .map(v => values.charAt((v >>> 0) % values.length))
            .join('');
    }
    // Returns an iterator that will generate `count` numbers.
    take(count) {
        return this[Symbol.iterator](count);
    }
    // Use JenkinsRandom#take(number) instead
    // Returns up to 10 values
    *[(_a = new WeakMap(), _b = new WeakMap(), _c = new WeakMap(), _d = new WeakMap(), Symbol.iterator)](count = 10) {
        for (let i = 0; i < count; ++i)
            yield this.nextRand();
    }
}
exports.PRNG = PRNG;
