/// <reference types="emscripten" />
type LocationLike = Pick<Location, "href" | "origin" | "protocol">;
declare function normalizeLibraryLocation(libraryLocation: string, pageLocation?: LocationLike): string;
declare function isCDNLocation(location: string): {
    result: boolean;
    cdnBaseURL: string;
};
declare function extractPackageNameFromURL(url: string): string | null;
declare function getLibraryLocationURIs(version: string, normalizedLibraryLocation: string, wasmFileName: string): {
    jsURI: string;
    wasmURI: string;
};

export { type LocationLike, extractPackageNameFromURL, getLibraryLocationURIs, isCDNLocation, normalizeLibraryLocation };
