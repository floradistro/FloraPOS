/// <reference types="emscripten" />
import { G as GetAppInfoResponse, a as GetLicenseKeyResponse } from '../common-4FJYEFaM.js';

/**
 * Check if is an electron app.
 * @returns Whether or not the platform is Electron.
 * @hidden
 */
declare function isElectron(): boolean;
/**
 * Get the appId and if app is packaged from the hybrid desktop platform layer
 * @hidden
 */
declare function getAppInfo(): Promise<GetAppInfoResponse["payload"] | undefined>;
/**
 * Get the key from the hybrid desktop platform layer
 * @hidden
 */
declare function getKey(config: {
    licenseDataPath: string;
}): Promise<GetLicenseKeyResponse["payload"] | undefined>;

export { getAppInfo, getKey, isElectron };
