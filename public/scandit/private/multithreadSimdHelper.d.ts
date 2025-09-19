/// <reference types="emscripten" />
/**
 * A website is in a cross-origin isolated state,
 * when the response header
 * * Cross-Origin-Opener-Policy has the value same-origin and the
 * * Cross-Origin-Embedder-Policy header has the value require-corp or credentialless
 * when true SharedArrayBuffer class will be available in the scope if browser supports it
 * @returns if a site is crossOriginIsolated
 */
declare function isCrossOriginIsolated(): boolean;
/**
 * Even if the site is not crossOriginIsolated this function
 * check whether or not the browser is capable to use SharedArrayBuffer
 * @returns if browser supports SharedArrayBuffer regardless crossOriginIsolated value
 */
declare function hasSharedArrayBufferSupport(): boolean;
declare function hasSIMDSupport(): Promise<boolean>;
/**
 * Checks if browser supports threads and is able to instantiate
 * a Worker from another Worker.
 * @returns
 */
declare function hasThreadsSupport(): Promise<boolean>;
/**
 * To have full multithread support a browser must be
 * crossOriginIsolated, support nested workers and capable to use SharedArrayBuffer
 * @returns Checks if browser has full multithread support
 */
declare function checkFullMultithreadingSupport(): Promise<boolean>;

export { checkFullMultithreadingSupport, hasSIMDSupport, hasSharedArrayBufferSupport, hasThreadsSupport, isCrossOriginIsolated };
