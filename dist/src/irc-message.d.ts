/// <reference types="node" />
interface Sender {
    nick?: string;
    user?: string;
    host?: string;
}
declare class IrcMessage {
    #private;
    tags: Map<string, string | boolean>;
    sender: Sender;
    command: string;
    parameters: string[];
    private tokenizeMain;
    private parseTag;
    private parseSender;
    toEncodedString(encoding: BufferEncoding | undefined): Buffer;
    toString(): string;
    constructor(m: string);
}
export { IrcMessage };
