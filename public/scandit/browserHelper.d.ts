/// <reference types="emscripten" />
import { BrowserCompatibility } from './browserCompatibility.js';

declare namespace BrowserHelper {
    /**
     * @hidden
     */
    interface Browser {
        name?: string;
        version?: string;
    }
    /**
     * @hidden
     */
    interface CPU {
        architecture?: string;
    }
    /**
     * @hidden
     */
    interface Device {
        model?: string;
        vendor?: string;
        type?: string;
    }
    /**
     * @hidden
     */
    interface Engine {
        name?: string;
        version?: string;
    }
    /**
     * @hidden
     */
    interface OS {
        name?: string;
        version?: string;
    }
    interface UserAgentInfo {
        getBrowser: () => Browser;
        getOS: () => OS;
        getEngine: () => Engine;
        getDevice: () => Device;
        getCPU: () => CPU;
        getUA: () => string;
        setUA: (uastring: string) => void;
    }
    /**
     * @hidden
     */
    export function getUserAgentInfo(): UserAgentInfo;
    /**
     * @hidden
     *
     * @returns Whether the device is a desktop/laptop for sure.
     */
    export function isDesktopDevice(): boolean;
    export function isIPhone(): boolean;
    /**
     * @hidden
     *
     * @returns Whether the device is a iOS device running a recent-enough OS version allowing any browser to access all
     * available cameras (including the UltraWide one).
     */
    export function isIOSDeviceWithExtendedCameraAccess(): boolean;
    export function getCanvas(): HTMLCanvasElement | null;
    /**
     * @hidden
     *
     */
    export function hasSIMDSupport(): Promise<boolean>;
    /**
     * @hidden
     *
     */
    export function hasThreadsSupport(): Promise<boolean>;
    /**
     * @returns The built [[BrowserCompatibility]] object representing the current OS/Browser's support for features.
     */
    export function checkBrowserCompatibility(): BrowserCompatibility;
    export function checkMultithreadingSupport(): Promise<boolean>;
    /**
     * @hidden
     *
     * Get a device id for the current browser.
     *
     * When available it's retrieved from localStorage, as fallback from cookies (used by older library versions),
     * when not available it's randomly generated and stored in localStorage to be retrieved by later calls and returned.
     *
     * @returns The device id for the current browser.
     */
    export function getDeviceId(): string;
    /**
     * @hidden
     *
     * Check if a given object is a valid HTMLElement
     *
     * @param object The object to check.
     * @returns Whether the given object is a valid HTMLElement.
     */
    export function isValidHTMLElement(object: unknown): boolean;
    /**
     * Check if the iOS version is at least 14.6.
     * @returns Whether iOS version is at least 14.6.
     * @hidden
     */
    export function isSupportedIOSVersion(): boolean;
    /**
     * Check if the browser is Safari.
     * @returns Whether the browser is safari.
     * @hidden
     */
    export function isSafari(): boolean;
    /**
     * Check if the document is served by an iOS web view.
     * @returns Whether the document is served by an iOS web view.
     * @hidden
     */
    export function isIosWebView(): boolean;
    /**
     * Check if the document is served by an Android web view.
     * @returns Whether the document is served by an Android web view.
     * @hidden
     */
    export function isAndroidWebView(): Promise<boolean>;
    /**
     * Check if the OS is Windows.
     * @returns Whether the OS is Windows.
     * @hidden
     */
    export function isWindows(): boolean;
    /**
     * Check if the browser is Firefox.
     * @returns Whether the browser is Firefox.
     * @hidden
     */
    export function isFirefox(): boolean;
    /**
     * Get the vibration method supported by the current browser and device, if any.
     * @returns The vibration method supported by the current browser and device, if any.
     * @hidden
     */
    export function getSupportedVibrationMethod(): typeof navigator.vibrate | undefined;
    /**
     * Check if vibration is supported by the current browser and device.
     * @returns Whether vibration is supported by the current browser and device.
     * @hidden
     */
    export function isVibrationAvailable(): boolean;
    /**
     * Check if the OS is iOS.
     * @returns Whether the OS is iOS.
     * @hidden
     */
    export function isIOS(): boolean;
    /**
     * Check if the browser supports the Animation API.
     * @returns Whether the browser supports the Animation API.
     * @hidden
     */
    export function isAnimationApiSupported(): boolean;
    export {  };
}

export { BrowserHelper };
