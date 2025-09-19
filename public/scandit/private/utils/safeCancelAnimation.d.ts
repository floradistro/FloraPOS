/// <reference types="emscripten" />
/**
 * Web Animations API Robust Animation Utilities
 *
 * This module provides safe ways to work with Web Animations API animations,
 * handling compatibility differences between different polyfills and native implementations.
 *
 * ## Background: Polyfill Compatibility Issues
 *
 * Different polyfills behave differently when cancelling animations:
 * - **Our AnimationSimplePolyfill**: Resolves promises, no errors (permissive)
 * - **web-animations-js**: Rejects promises, throws AbortError (strict spec)
 * - **Native browsers**: Varies - some silent, some throw errors
 *
 * ## Our Solution: Handle All Scenarios
 *
 * Instead of assuming one behavior, we handle all possible outcomes:
 * - Try to cancel animations and handle any errors
 * - Safely await animation.finished promises with proper error handling
 * - Ensure elements are always in a good state after operations
 *
 * ## Technical Details
 *
 * According to the Web Animations API specification:
 * - An animation can be in one of several states: "idle", "running", "paused", "finished"
 * - Calling `cancel()` on an animation in "idle" or "finished" state may throw AbortError
 * - The `finished` promise may be rejected with AbortError when animations are cancelled
 * - Different polyfills enforce this to varying degrees
 * - Our utilities ensure compatibility across all implementations
 *
 * ## References
 * - Web Animations API Specification: https://www.w3.org/TR/web-animations-1/
 * - MDN Web Animations API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
 * - MDN Animation.cancel(): https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel
 * - AbortError: https://developer.mozilla.org/en-US/docs/Web/API/AbortError
 */
/**
 * Safely cancels a Web Animation, handling any errors that may be thrown by strict polyfills.
 *
 * @param animation - The animation to cancel
 * @returns true if the animation was successfully cancelled, false if it failed or was already finished
 */
declare function safeCancelAnimation(animation: Animation | null | undefined): boolean;
/**
 * Safely awaits an animation's finished promise, handling potential AbortError rejections
 * from strict polyfills when animations are cancelled.
 *
 * @param animation - The animation to await
 * @returns Promise that resolves when animation completes or is cancelled (never rejects)
 */
declare function safeAwaitAnimation(animation: Animation | null | undefined): Promise<void>;

export { safeAwaitAnimation, safeCancelAnimation };
