/// <reference types="emscripten" />
declare function warnMultithreadingUnavailable(): Promise<void>;

export { warnMultithreadingUnavailable };
