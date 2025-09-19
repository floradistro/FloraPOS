/// <reference types="emscripten" />
/**
 * Copyright (C) 2024 Scandit AG. All rights reserved.
 *
 * Polyfill loader utility
 * This module handles the dynamic loading of various polyfills needed for browser compatibility.
 */
/**
 * Options for polyfill loading
 */
interface PolyfillOptions {
    /** Whether to force loading the animation polyfill */
    forceAnimationPolyfill?: boolean;
    /** Whether to force loading the structuredClone polyfill */
    forceStructuredClonePolyfill?: boolean;
    /** Whether to force loading all polyfills */
    forceAllPolyfills?: boolean;
}
/**
 * Loads all necessary polyfills for browser compatibility
 * @param options Polyfill loading options
 */
declare function loadPolyfills(options?: PolyfillOptions): Promise<void>;

export { type PolyfillOptions, loadPolyfills };
