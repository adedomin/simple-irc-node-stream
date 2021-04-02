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

interface Sender
{
    nick?: string,
    user?: string,
    host?: string,
}

enum ParserState
{
    Tag,
    Sender,
    Command,
    Params,
    Multi,
}

class IrcMessage {
    tags: Map<string, string|boolean> = new Map();
    sender: Sender = { nick: undefined, user: undefined, host: undefined };
    command: string = '';
    parameters: string[] = [];

    #ircTokenizer = /(?<word>\S+)|(?<space>\s+)/g;
    #tagGrammar = /(?<key>[^;=\s]+)(?:=(?<val>[^;\s]+))?;?/g;
    #senderGrammar = /^:(?<nick>[^!\s]+)!(?<user>[^\s@]+)@(?<host>[^\s]+)$/;

    private parseTag(tagstr: string): void {
        for (const { groups } of tagstr.slice(1).matchAll(this.#tagGrammar)) {
            this.tags.set(groups?.key ?? '', groups?.val ?? true);
        }
    }

    private parseSender(senderstr: string): void {
        const { groups } = senderstr.match(this.#senderGrammar) ?? {};
        this.sender.nick = groups?.nick ?? senderstr.slice(1);
        this.sender.user = groups?.user;
        this.sender.host = groups?.host;
    }

    toEncodedString(encoding: BufferEncoding|undefined): Buffer {
        return Buffer.from(this.toString(), encoding);
    }

    toString() {
        let tags = '';
        for (const [ k, v ] of this.tags) {
            if (typeof v === 'boolean') tags += `${k};`;
            else tags += `${k}=${v};`;
        }
        let sender = '';
        if (this.sender.nick !== undefined) sender += `:${this.sender.nick}`;
        if (this.sender.user !== undefined) sender += `!${this.sender.user}`;
        if (this.sender.host !== undefined) sender += `@${this.sender.host}`;


        const paramsCopy = this.parameters.slice();
        if (
            paramsCopy.length > 0 &&
            paramsCopy[paramsCopy.length-1].includes(' ')
        ) {
            paramsCopy[paramsCopy.length-1] = `:${paramsCopy[paramsCopy.length-1]}`;
        }
        const params = paramsCopy.join(' ');

        return `${tags !== '' ? `@${tags} ` : ''}${sender !== '' ? `${sender} ` : ''}${this.command}${params !== '' ? ` ${params}` : ''}\r\n`;
    }

    constructor(message: string) {
        let parseState: ParserState = ParserState.Tag;
        for (const { groups } of message.matchAll(this.#ircTokenizer)) {
            for (const m in groups) {
                const match = groups[m];
                if (match === undefined) {
                    continue;
                }
                else if (
                    m === 'space' &&
                    parseState !== ParserState.Multi
                ) {
                    continue;
                }

                let handled = false;
                // a GOTO, if you will.
                while (!handled) {
                    switch (parseState as ParserState) {
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
                        this.parameters[this.parameters.length-1] += match;
                        handled = true;
                    }
                }
            }
        }
    }
}

export { IrcMessage };
