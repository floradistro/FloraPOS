/// <reference types="emscripten" />
interface ContextBridgeApi {
    getAppInfo: () => Promise<GetAppInfoResponse["payload"]>;
    getKey: (options: {
        licenseDataPath: string;
    }) => Promise<GetLicenseKeyResponse["payload"]>;
}
type GetAppInfoMessageKey = "get-app-info";
type GetLicenseMessageKey = "get-license-key";
interface GenericResponse<T> {
    type: T;
    senderId: string;
    payload: T extends GetLicenseMessageKey ? {
        licenseKey: string;
    } : T extends GetAppInfoMessageKey ? {
        isPackaged: boolean;
        appId: string;
        appName: string;
        version: string;
    } : never;
}
type GetLicenseKeyResponse = GenericResponse<GetLicenseMessageKey>;
type GetAppInfoResponse = GenericResponse<GetAppInfoMessageKey>;

export type { ContextBridgeApi as C, GetAppInfoResponse as G, GetLicenseKeyResponse as a };
