/// <reference types="emscripten" />
interface DataCaptureErrorDetails {
    message: string;
    name: string;
}
declare class DataCaptureError extends Error {
    readonly name: string;
    readonly message: string;
    constructor(details: DataCaptureErrorDetails);
    toString(): string;
}

export { DataCaptureError, type DataCaptureErrorDetails };
