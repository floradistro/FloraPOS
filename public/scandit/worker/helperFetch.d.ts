/// <reference types="emscripten" />
import { ProgressInfo } from '../LoadingStatus.js';

declare enum ResponseValidity {
    VALID = "VALID",
    INVALID = "INVALID",
    NOT_VERIFIABLE = "NOT_VERIFIABLE"
}
declare function verifyResponseData(responseData: ArrayBuffer | Promise<ArrayBuffer>, expectedHash: string | undefined, wasmURI: string): Promise<ResponseValidity>;
interface ProgressListener {
    onProgress?: (info: ProgressInfo) => void;
    onError?: ({ error }: {
        error: unknown;
    }) => void;
    onComplete?: (info: ProgressInfo) => void;
}
declare function setWasmMetadata(wasmMetadata_: Record<string, {
    bytes: number;
}>): void;
declare const getTotalInBytes: (wasmURI: string, headers?: Headers) => number;
declare function createResponseWithProgress(wasmUri: string, response: Response, returnVerificationStream: boolean, { onProgress, onError, onComplete }: ProgressListener): [Response, ReadableStream<Uint8Array>?];
interface FetchWasmParameters {
    wasmURI: string;
    expectedHash: string;
    verifyResponseHash: boolean;
    onProgress?: (info: ProgressInfo) => void;
    onComplete?: (info: ProgressInfo) => void;
    onError?: (error: unknown) => void;
    referredOrigin?: string;
}
declare function fetchWasm({ wasmURI, expectedHash, verifyResponseHash, onProgress, onComplete, onError, referredOrigin, }: FetchWasmParameters): Promise<Response>;

export { ResponseValidity, createResponseWithProgress, fetchWasm, getTotalInBytes, setWasmMetadata, verifyResponseData };
