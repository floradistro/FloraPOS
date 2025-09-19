/// <reference types="emscripten" />
import { ProgressInfo } from '../LoadingStatus.js';

declare function instantiateWebAssembly({ wasmURI, expectedHash, verifyResponseHash, progressCallback, successCallback, errorCallback, importObject, referredOrigin, }: {
    importObject: WebAssembly.Imports;
    wasmURI: string;
    expectedHash: string;
    verifyResponseHash: boolean;
    successCallback: (instance: WebAssembly.Instance, wasmModule: WebAssembly.Module) => void;
    progressCallback?: (info: ProgressInfo) => void;
    errorCallback?: (error: Error) => void;
    referredOrigin?: string;
}): void;
declare function retryWithExponentialBackoff<T>(handler: () => Promise<T>, backoffMs: number, maxBackoffMs: number, singleTryRejectionCallback: (error: Error) => void): Promise<T>;
declare function getDomain(location: Location | URL): string;

export { getDomain, instantiateWebAssembly, retryWithExponentialBackoff };
