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

import { Transform } from 'stream';
import type { TransformOptions } from 'stream';
import { IrcMessage } from './irc-message';

type WriteCallback = (err?: Error) => void;

class SimpleIrcIn extends Transform {
    #encode: TransformOptions['encoding'];
    #chunk = '';

    constructor(options: TransformOptions = {}) {
        super({ ...options, objectMode: true });
        this.#encode = options?.encoding ?? 'utf8';
    }

    _transform(
        data: (Buffer|string|any),
        encoding: TransformOptions['encoding'],
        callback: WriteCallback,
    ): void {
        let textData: string;
        if (data instanceof Buffer) {
            textData = data.toString(encoding ?? this.#encode);
        }
        else if (typeof data === 'string') {
            textData = data;
        }
        else {
            const err = new TypeError('data is not a buffer or a string');
            return callback(err);
        }

        this.#chunk += textData;
        let nextLine = this.#chunk.indexOf('\r\n');
        while (nextLine > -1) {
            const line = this.#chunk.slice(0, nextLine);
            this.#chunk = this.#chunk.slice(nextLine+2);
            this.push(new IrcMessage(line));
            nextLine = this.#chunk.indexOf('\r\n');
        }

        callback();
    }
}

class SimpleIrcOut extends Transform {
    #encode: TransformOptions['encoding'];

    constructor(options: TransformOptions = {}) {
        super({ ...options, objectMode: true });
        this.#encode = options?.encoding ?? 'utf8';
    }

    _transform(
        data: (IrcMessage|string|any),
        encoding: TransformOptions['encoding'],
        callback: WriteCallback,
    ): void {
        let outBuffer: Buffer;
        if (data instanceof IrcMessage) {
            outBuffer = data.toEncodedString(encoding ?? this.#encode);
        }
        else if (typeof data === 'string') {
            outBuffer = Buffer.from(data, encoding ?? this.#encode);
        }
        else {
            const err = new TypeError('data is not an IrcMessage or a string');
            return callback(err);
        }

        this.push(outBuffer);
        callback();
    }
}

function SimpleIrc(encoding: TransformOptions['encoding']): [ SimpleIrcIn, SimpleIrcOut ] {
    const inp = new SimpleIrcIn({ encoding });
    const out = new SimpleIrcOut({ encoding });
    return [ inp, out ];
}

export { IrcMessage, SimpleIrc, SimpleIrcIn, SimpleIrcOut };
