/// <reference types="emscripten" />
declare function wait(ms?: number): Promise<void>;

export { wait };
