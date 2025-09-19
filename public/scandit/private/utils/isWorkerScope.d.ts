/// <reference types="emscripten" />
declare function isWorkerScope(maybeSelf: unknown): maybeSelf is Worker;

export { isWorkerScope };
