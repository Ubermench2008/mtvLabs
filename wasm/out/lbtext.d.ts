import { N } from './ast';
export type Writer = (s: string) => void;
export declare function printCode(instructions: N[], writer: Writer): void;
