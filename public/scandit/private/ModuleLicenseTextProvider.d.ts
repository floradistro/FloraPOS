/// <reference types="emscripten" />
interface ModuleLicenseTextProvider {
    getLicenseText(): Promise<string>;
}

export type { ModuleLicenseTextProvider };
