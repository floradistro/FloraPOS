/// <reference types="emscripten" />
import { DataCaptureError } from '../DataCaptureError.js';
import { BrowserCompatibility } from '../browserCompatibility.js';

declare class UnsupportedBrowserError extends DataCaptureError {
    readonly data?: BrowserCompatibility;
    constructor(browserCompatibility: BrowserCompatibility);
}

export { UnsupportedBrowserError };
