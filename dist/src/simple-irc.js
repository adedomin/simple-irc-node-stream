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
var _encode, _chunk, _encode_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleIrcOut = exports.SimpleIrcIn = exports.SimpleIrc = exports.IrcMessage = void 0;
const stream_1 = require("stream");
const irc_message_1 = require("./irc-message");
Object.defineProperty(exports, "IrcMessage", { enumerable: true, get: function () { return irc_message_1.IrcMessage; } });
class SimpleIrcIn extends stream_1.Transform {
    constructor(encoding = 'utf8') {
        super({ readableObjectMode: true });
        _encode.set(this, void 0);
        _chunk.set(this, '');
        __classPrivateFieldSet(this, _encode, encoding);
    }
    _transform(data, encoding, callback) {
        let textData;
        if (data instanceof Buffer) {
            textData = data.toString(encoding === 'buffer' ? __classPrivateFieldGet(this, _encode) : encoding);
        }
        else if (typeof data === 'string') {
            textData = data;
        }
        else {
            const err = new TypeError('data is not a buffer or a string');
            return callback(err);
        }
        __classPrivateFieldSet(this, _chunk, __classPrivateFieldGet(this, _chunk) + textData);
        let nextLine = __classPrivateFieldGet(this, _chunk).indexOf('\r\n');
        while (nextLine > -1) {
            const line = __classPrivateFieldGet(this, _chunk).slice(0, nextLine);
            __classPrivateFieldSet(this, _chunk, __classPrivateFieldGet(this, _chunk).slice(nextLine + 2));
            this.push(new irc_message_1.IrcMessage(line));
            nextLine = __classPrivateFieldGet(this, _chunk).indexOf('\r\n');
        }
        callback();
    }
}
exports.SimpleIrcIn = SimpleIrcIn;
_encode = new WeakMap(), _chunk = new WeakMap();
class SimpleIrcOut extends stream_1.Transform {
    constructor(encoding = 'utf8') {
        super({ writableObjectMode: true });
        _encode_1.set(this, void 0);
        __classPrivateFieldSet(this, _encode_1, encoding ?? 'utf8');
    }
    _transform(data, encoding, callback) {
        let outBuffer;
        if (data instanceof irc_message_1.IrcMessage) {
            outBuffer = data.toEncodedString(__classPrivateFieldGet(this, _encode_1));
        }
        else if (typeof data === 'string') {
            outBuffer = Buffer.from(data, __classPrivateFieldGet(this, _encode_1));
        }
        else {
            const err = new TypeError('data is not an IrcMessage or a string');
            return callback(err);
        }
        this.push(outBuffer);
        callback();
    }
}
exports.SimpleIrcOut = SimpleIrcOut;
_encode_1 = new WeakMap();
function SimpleIrc(encoding = 'utf8') {
    const inp = new SimpleIrcIn(encoding);
    const out = new SimpleIrcOut(encoding);
    return [inp, out];
}
exports.SimpleIrc = SimpleIrc;
