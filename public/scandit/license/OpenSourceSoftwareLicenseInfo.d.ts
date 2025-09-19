/// <reference types="emscripten" />
declare class OpenSourceSoftwareLicenseInfo {
    private _licenseText;
    constructor(licenseText: string);
    get licenseText(): string;
}

export { OpenSourceSoftwareLicenseInfo };
