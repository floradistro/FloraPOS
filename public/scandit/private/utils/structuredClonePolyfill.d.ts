/// <reference types="emscripten" />
/**
 * Copyright (C) 2024 Scandit AG. All rights reserved.
 *
 * structuredClone polyfill for older browsers
 * This polyfill provides a fallback implementation when structuredClone is not available.
 * Based on the polyfill from https://github.com/ungap/structured-clone
 */
/**
 * Registers the structuredClone polyfill if it's not already available
 * @returns true if the polyfill was applied, false if structuredClone already exists
 */
declare function structuredClonePolyfill(): boolean;

export { structuredClonePolyfill };
