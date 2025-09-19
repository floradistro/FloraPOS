/// <reference types="emscripten" />
/**
 * Copyright (C) 2024 Scandit AG. All rights reserved.
 *
 * globalThis polyfill for older browsers
 * This polyfill ensures globalThis is available in all supported browsers.
 * Based on the polyfill from https://github.com/es-shims/globalThis
 */
/**
 * Registers the globalThis polyfill if it's not already available
 * @returns true if the polyfill was applied, false if globalThis already exists
 */
declare function globalThisPolyfill(): boolean;

export { globalThisPolyfill };
