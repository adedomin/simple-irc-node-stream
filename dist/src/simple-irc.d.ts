/// <reference types="node" />
import { Transform } from 'stream';
import type { TransformOptions } from 'stream';
import { IrcMessage } from './irc-message';
declare type WriteCallback = (err?: Error) => void;
declare class SimpleIrcIn extends Transform {
    #private;
    constructor(encoding?: TransformOptions['encoding']);
    _nextline(): [number, number];
    _transform(data: (Buffer | string | any), encoding: TransformOptions['encoding'] | 'buffer', callback: WriteCallback): void;
}
declare class SimpleIrcOut extends Transform {
    #private;
    constructor(encoding?: TransformOptions['encoding']);
    _transform(data: (IrcMessage | string | any), encoding: TransformOptions['encoding'] | 'buffer', callback: WriteCallback): void;
}
declare function SimpleIrc(encoding?: TransformOptions['encoding']): [SimpleIrcIn, SimpleIrcOut];
export { IrcMessage, SimpleIrc, SimpleIrcIn, SimpleIrcOut };
