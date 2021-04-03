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
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const testing_prng_1 = require("testing-prng");
const irc_message_1 = require("../src/irc-message");
var TestIrc;
(function (TestIrc) {
    TestIrc[TestIrc["add_nick"] = 0] = "add_nick";
    TestIrc[TestIrc["no_nick"] = 1] = "no_nick";
    TestIrc[TestIrc["add_space"] = 2] = "add_space";
    TestIrc[TestIrc["add_word"] = 3] = "add_word";
    TestIrc[TestIrc["add_multi"] = 4] = "add_multi";
    TestIrc[TestIrc["done"] = 5] = "done";
})(TestIrc || (TestIrc = {}));
function testIrcMessage(r) {
    let randstr = '';
    const add_nick = r.choose([
        { w: 5, v: TestIrc.add_nick },
        { w: 1, v: TestIrc.no_nick },
    ]);
    let nick;
    let user;
    let host;
    if (add_nick === TestIrc.add_nick) {
        nick = r.getRandomAlphaNum();
        user = r.getRandomAlphaNum();
        host = r.getRandomAlphaNum();
        randstr += `:${nick}!${user}@${host} `;
    }
    const command = r.getRandomAlphaNum();
    randstr += command;
    let curr;
    const params = [];
    let is_multi = false;
    loop: while (randstr.length < 256) {
        // w = 0 means choice is impossible.
        curr = r.choose([
            { w: 1, v: TestIrc.add_space },
            { w: 8, v: TestIrc.add_word },
            { w: !is_multi ? 5 : 0, v: TestIrc.add_multi },
            { w: 3, v: TestIrc.done },
        ]);
        switch (curr) {
            case TestIrc.add_space:
                if (is_multi) {
                    params[params.length - 1] += ' ';
                }
                randstr += ' ';
                break;
            case TestIrc.add_word:
                {
                    const word = r.getRandomAlphaNum();
                    if (is_multi) {
                        params[params.length - 1] += ' ' + word;
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
    const newMsg = new irc_message_1.IrcMessage(randstr);
    return nick !== newMsg.sender.nick ? false
        : user !== newMsg.sender.user ? false
            : host !== newMsg.sender.host ? false
                : command !== newMsg.command ? false
                    : params.reduce((a, v, i) => a && (v === newMsg.parameters[i]), true);
}
let rng_seed;
if (/^[0-9]+$/.test(process_1.argv[2]) && +process_1.argv[2] < Number.MAX_SAFE_INTEGER) {
    rng_seed = +process_1.argv[2];
}
else {
    rng_seed = (new Date()).getTime();
}
const prng = new testing_prng_1.PRNG(rng_seed);
let parsedOk = true;
for (let i = 0; i < 100000; ++i) {
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
    process_1.exit(1);
}
