export type DesiredMark = 3 | 4 | 5 | "5+";
export declare function test<T extends any[], R>(name: string, testMark: DesiredMark, fn: (...args: T) => R, expected: ResultOrException<R>, ...args: T): void;
type F<R> = () => R;
type ResultOrException<R> = ExceptionType | Awaited<R> | F<Awaited<R>>;
interface ExceptionType {
    new (...args: any[]): any;
}
export {};
