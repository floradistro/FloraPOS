/// <reference types="emscripten" />
declare class SafeStorage implements Storage {
    private storage;
    private memoryFallback;
    isSupported: boolean;
    constructor(type: "localStorage" | "sessionStorage");
    get length(): number;
    static isStorageTypeSupported(type: "localStorage" | "sessionStorage"): boolean;
    key(index: number): string | null;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}
declare const localStorage: SafeStorage;
declare const sessionStorage: SafeStorage;

export { SafeStorage, localStorage, sessionStorage };
