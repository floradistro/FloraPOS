/// <reference types="emscripten" />
declare namespace Logger {
    /**
     * Log level.
     */
    enum Level {
        Debug = "debug",
        Info = "info",
        Warn = "warn",
        Error = "error",
        Quiet = "quiet"
    }
    /**
     *
     * @param level The log level.
     */
    function setLevel(level: Level): void;
    /**
     *
     * @param level The log level.
     * @param data The log contents.
     */
    function log(level: Exclude<Level, Level.Quiet>, ...data: unknown[]): void;
    function warn(...data: unknown[]): void;
    function debug(...data: unknown[]): void;
    function info(...data: unknown[]): void;
    function error(...data: unknown[]): void;
}

export { Logger };
