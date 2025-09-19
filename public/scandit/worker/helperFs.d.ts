/// <reference types="emscripten" />
interface SetupFSOptions {
    writableDataPath: string;
}
declare function setupFS(options: SetupFSOptions): Promise<void>;

export { setupFS };
