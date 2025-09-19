/// <reference types="emscripten" />
declare class Timeout {
    private static readonly maxDurationAllowedByJSEngines;
    private duration;
    private callback;
    private timeout?;
    private _running;
    constructor(duration: number, callback: VoidFunction);
    get running(): boolean;
    start(): void;
    stop(): void;
}

export { Timeout };
