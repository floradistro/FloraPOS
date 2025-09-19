/// <reference types="emscripten" />
declare function importWasmScript(jsURI: string, sdkVersion: string): Promise<boolean>;

export { importWasmScript };
