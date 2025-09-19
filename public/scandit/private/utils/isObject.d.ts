/// <reference types="emscripten" />
declare function isObject(target: unknown): target is Record<string, unknown>;

export { isObject };
