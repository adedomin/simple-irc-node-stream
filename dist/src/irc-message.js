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
var _tagGrammar;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IrcMessage = void 0;
var TokenState;
(function (TokenState) {
    TokenState[TokenState["Word"] = 0] = "Word";
    TokenState[TokenState["Space"] = 1] = "Space";
})(TokenState || (TokenState = {}));
var ParserState;
(function (ParserState) {
    ParserState[ParserState["Tag"] = 0] = "Tag";
    ParserState[ParserState["Sender"] = 1] = "Sender";
    ParserState[ParserState["Command"] = 2] = "Command";
    ParserState[ParserState["Params"] = 3] = "Params";
    ParserState[ParserState["Multi"] = 4] = "Multi";
})(ParserState || (ParserState = {}));
class IrcMessage {
    constructor(m) {
        this.tags = new Map();
        this.sender = { nick: undefined, user: undefined, host: undefined };
        this.command = '';
        this.parameters = [];
        _tagGrammar.set(this, /(?<key>[^;=\s]+)(?:=(?<val>[^;\s]+))?;?/g);
        // Strip line separators.
        const message = m.endsWith('\r\n')
            ? m.slice(0, m.length - 2)
            : m.endsWith('\n')
                ? m.slice(0, m.length - 1)
                : m;
        let parseState = ParserState.Tag;
        for (const [is_a, token] of this.tokenizeMain(message)) {
            if (is_a === TokenState.Space &&
                parseState !== ParserState.Multi) {
                continue;
            }
            let handled = false;
            // a GOTO, if you will.
            while (!handled) {
                switch (parseState) {
                    case ParserState.Tag:
                        if (token[0] === '@') {
                            this.parseTag(token);
                            handled = true;
                        }
                        else {
                            parseState = ParserState.Sender;
                        }
                        break;
                    case ParserState.Sender:
                        if (token[0] === ':') {
                            this.parseSender(token);
                            handled = true;
                        }
                        else {
                            parseState = ParserState.Command;
                        }
                        break;
                    case ParserState.Command:
                        this.command = token;
                        parseState = ParserState.Params;
                        handled = true;
                        break;
                    case ParserState.Params:
                        if (token[0] !== ':') {
                            this.parameters.push(token);
                            handled = true;
                        }
                        else {
                            parseState = ParserState.Multi;
                            this.parameters.push(token.slice(1));
                            handled = true;
                        }
                        break;
                    case ParserState.Multi:
                        this.parameters[this.parameters.length - 1] += token;
                        handled = true;
                }
            }
        }
    }
    *tokenizeMain(input) {
        // start state depends on if we have leading space or not.
        let state = input[0] === ' '
            ? TokenState.Space
            : TokenState.Word;
        let tokenStart = 0;
        for (let i = 0; i < input.length; ++i) {
            const chr = input[i];
            switch (state) {
                case TokenState.Word:
                    if (chr === ' ') {
                        yield [state, input.slice(tokenStart, i)];
                        tokenStart = i;
                        state = TokenState.Space;
                    }
                    break;
                case TokenState.Space:
                    if (chr !== ' ') {
                        yield [state, input.slice(tokenStart, i)];
                        tokenStart = i;
                        state = TokenState.Word;
                    }
                    break;
            }
        }
        yield [state, input.slice(tokenStart)];
    }
    parseTag(tagstr) {
        for (const { groups } of tagstr.slice(1).matchAll(__classPrivateFieldGet(this, _tagGrammar))) {
            this.tags.set(groups?.key ?? '', groups?.val ?? true);
        }
    }
    parseSender(senderstr) {
        let start_user = senderstr.indexOf('!');
        let start_host = senderstr.indexOf('@', start_user + 1);
        // work backwards
        if (start_host !== -1)
            this.sender.host =
                senderstr.slice(start_host + 1);
        else
            start_host = senderstr.length;
        if (start_user !== -1)
            this.sender.user =
                senderstr.slice(start_user + 1, start_host);
        else
            start_user = start_host;
        // This assumes this is always nonzero length, which may not be true.
        this.sender.nick = senderstr.slice(1, start_user);
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
_tagGrammar = new WeakMap();
