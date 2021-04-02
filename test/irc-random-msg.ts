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

import { argv, exit } from 'process';
import { PRNG } from 'testing-prng';
import { IrcMessage } from '../src/irc-message';

enum TestIrc
{
    add_nick,
    no_nick,
    add_space,
    add_word,
    add_multi,
    done,
}

function testIrcMessage(r: PRNG): boolean {
    let randstr = '';
    const add_nick = r.choose([
        { w: 5, v: TestIrc.add_nick },
        { w: 1, v: TestIrc.no_nick },
    ]);

    let nick: string|undefined;
    let user: string|undefined;
    let host: string|undefined;
    if (add_nick === TestIrc.add_nick) {
        nick = r.getRandomAlphaNum();
        user = r.getRandomAlphaNum();
        host = r.getRandomAlphaNum();
        randstr += `:${nick}!${user}@${host} `;
    }

    const command = r.getRandomAlphaNum();
    randstr += command;

    let curr;
    const params: string[] = [];
    let is_multi = false;
    loop:
    while (randstr.length < 256) {
        // w = 0 means choice is impossible.
        curr = r.choose([
            { w: 1,                 v: TestIrc.add_space },
            { w: 8,                 v: TestIrc.add_word },
            { w: !is_multi ? 5 : 0, v: TestIrc.add_multi },
            { w: 3,                 v: TestIrc.done },
        ]);

        switch (curr) {
        case TestIrc.add_space:
            if (is_multi) {
                params[params.length-1] += ' ';
            }
            randstr += ' ';
            break;
        case TestIrc.add_word:
            {
                const word = r.getRandomAlphaNum();
                if (is_multi) {
                    params[params.length-1] += ' ' + word;
                }
                else {
                    params.push(word);
                }
                randstr += ' ' + word;
            }
            break;
        case TestIrc.add_multi:
            {
                is_multi = true;
                const word = r.getRandomAlphaNum();
                params.push(word);
                randstr += ' :' + word;
            }
            break;
        case TestIrc.done:
            break loop;
        }
    }

    const newMsg = new IrcMessage(randstr);

    return nick    !== newMsg.sender.nick ? false
        :  user    !== newMsg.sender.user ? false
        :  host    !== newMsg.sender.host ? false
        :  command !== newMsg.command     ? false
        :  params.reduce((a, v, i) => a && (v === newMsg.parameters[i]), true as boolean);
}

let rng_seed;
if (/^[0-9]+$/.test(argv[2]) && +argv[2] < Number.MAX_SAFE_INTEGER) {
    rng_seed = +argv[2];
}
else {
    rng_seed = (new Date()).getTime();
}

const prng = new PRNG(rng_seed);

let parsedOk = true;

for (let i =0; i < 100_000; ++i) {
    if (!testIrcMessage(prng)) {
        parsedOk = false;
        break;
    }
}

if (parsedOk) {
    console.log('PASS: Parse Random IRC message.');
}
else {
    console.log('FAIL: Parse Random IRC message.');
    exit(1);
}
