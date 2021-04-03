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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _ircTokenizer, _tagGrammar, _senderGrammar;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IrcMessage = void 0;
var ParserState;
(function (ParserState) {
    ParserState[ParserState["Tag"] = 0] = "Tag";
    ParserState[ParserState["Sender"] = 1] = "Sender";
    ParserState[ParserState["Command"] = 2] = "Command";
    ParserState[ParserState["Params"] = 3] = "Params";
    ParserState[ParserState["Multi"] = 4] = "Multi";
})(ParserState || (ParserState = {}));
class IrcMessage {
    constructor(message) {
        this.tags = new Map();
        this.sender = { nick: undefined, user: undefined, host: undefined };
        this.command = '';
        this.parameters = [];
        _ircTokenizer.set(this, /(?<word>\S+)|(?<space>\s+)/g);
        _tagGrammar.set(this, /(?<key>[^;=\s]+)(?:=(?<val>[^;\s]+))?;?/g);
        _senderGrammar.set(this, /^:(?<nick>[^!\s]+)!(?<user>[^\s@]+)@(?<host>[^\s]+)$/);
        let parseState = ParserState.Tag;
        for (const { groups } of message.matchAll(__classPrivateFieldGet(this, _ircTokenizer))) {
            for (const m in groups) {
                const match = groups[m];
                if (match === undefined) {
                    continue;
                }
                else if (m === 'space' &&
                    parseState !== ParserState.Multi) {
                    continue;
                }
                let handled = false;
                // a GOTO, if you will.
                while (!handled) {
                    switch (parseState) {
                        case ParserState.Tag:
                            if (match[0] === '@') {
                                this.parseTag(match);
                                handled = true;
                            }
                            else {
                                parseState = ParserState.Sender;
                            }
                            break;
                        case ParserState.Sender:
                            if (match[0] === ':') {
                                this.parseSender(match);
                                handled = true;
                            }
                            else {
                                parseState = ParserState.Command;
                            }
                            break;
                        case ParserState.Command:
                            this.command = match;
                            parseState = ParserState.Params;
                            handled = true;
                            break;
                        case ParserState.Params:
                            if (match[0] !== ':') {
                                this.parameters.push(match);
                                handled = true;
                            }
                            else {
                                parseState = ParserState.Multi;
                                this.parameters.push(match.slice(1));
                                handled = true;
                            }
                            break;
                        case ParserState.Multi:
                            this.parameters[this.parameters.length - 1] += match;
                            handled = true;
                    }
                }
            }
        }
    }
    parseTag(tagstr) {
        for (const { groups } of tagstr.slice(1).matchAll(__classPrivateFieldGet(this, _tagGrammar))) {
            this.tags.set(groups?.key ?? '', groups?.val ?? true);
        }
    }
    parseSender(senderstr) {
        const { groups } = senderstr.match(__classPrivateFieldGet(this, _senderGrammar)) ?? {};
        this.sender.nick = groups?.nick ?? senderstr.slice(1);
        this.sender.user = groups?.user;
        this.sender.host = groups?.host;
    }
    toEncodedString(encoding) {
        return Buffer.from(this.toString(), encoding);
    }
    toString() {
        let tags = '';
        for (const [k, v] of this.tags) {
            if (typeof v === 'boolean')
                tags += `${k};`;
            else
                tags += `${k}=${v};`;
        }
        let sender = '';
        if (this.sender.nick !== undefined)
            sender += `:${this.sender.nick}`;
        if (this.sender.user !== undefined)
            sender += `!${this.sender.user}`;
        if (this.sender.host !== undefined)
            sender += `@${this.sender.host}`;
        const paramsCopy = this.parameters.slice();
        if (paramsCopy.length > 0 &&
            paramsCopy[paramsCopy.length - 1].includes(' ')) {
            paramsCopy[paramsCopy.length - 1] = `:${paramsCopy[paramsCopy.length - 1]}`;
        }
        const params = paramsCopy.join(' ');
        return `${tags !== '' ? `@${tags} ` : ''}${sender !== '' ? `${sender} ` : ''}${this.command}${params !== '' ? ` ${params}` : ''}\r\n`;
    }
}
exports.IrcMessage = IrcMessage;
_ircTokenizer = new WeakMap(), _tagGrammar = new WeakMap(), _senderGrammar = new WeakMap();
