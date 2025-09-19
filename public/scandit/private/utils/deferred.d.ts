/// <reference types="emscripten" />
declare class Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
    constructor();
}

export { Deferred };
