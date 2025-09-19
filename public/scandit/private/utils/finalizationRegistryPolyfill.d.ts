/// <reference types="emscripten" />
/**
 * Provides FinalizationRegistry polyfill when not available
 * @param target The target object (globalThis, self, or global) where FinalizationRegistry should be added
 */
declare function ensureFinalizationRegistry(target: any): void;

export { ensureFinalizationRegistry };
