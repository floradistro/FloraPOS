/// <reference types="emscripten" />
declare function assert(condition: unknown, message?: string): asserts condition;
declare function assertUnreachable(_: never): void;
declare function assertUnreachableThrowException(_: never): never;
type Mutable<T> = {
    -readonly [k in keyof T]: T[k];
};
type DeepMutable<T> = {
    -readonly [k in keyof T]: DeepMutable<T[k]>;
};
type DeepPartial<T> = T extends any[] ? T : T extends Record<string, any> ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
type MethodSignature<M extends (...arguments_: any[]) => any> = (...arguments_: Parameters<M>) => ReturnType<M>;
type Optional<T> = T | null | undefined;
/**
 * When given a union of objects, extracts all the keys of the union.
 *
 * "keyof ({a: string} | {b: string})" returns the never type.
 */
type DistributiveKeyOf<T> = T extends object ? keyof T : never;
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export { type DeepMutable, type DeepPartial, type DistributiveKeyOf, type MethodSignature, type Mutable, type Optional, type Prettify, assert, assertUnreachable, assertUnreachableThrowException };
