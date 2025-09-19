/// <reference types="emscripten" />
/**
 * Polyfill for Object.fromEntries() for Chrome 64+ compatibility.
 * Object.fromEntries() was introduced in Chrome 73, so this provides
 * backward compatibility for Chrome 64-72.
 *
 * @param entries An iterable object that contains key-value pairs
 * @returns A new object whose properties are given by the entries
 */
declare function fromEntries<T = any>(entries: Iterable<readonly [PropertyKey, T]>): {
    [k: string]: T;
};

export { fromEntries };
