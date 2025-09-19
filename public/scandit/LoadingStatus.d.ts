/// <reference types="emscripten" />
interface ProgressInfo {
    percentage: number | null;
    loadedBytes?: number;
    /**
     * @hidden
     *
     * Used internally
     */
    privateUri: string;
}
interface LoadingStatusSubscriber {
    (info: ProgressInfo): void;
}
declare class LoadingStatus {
    private readonly subscribers;
    subscribe(subscriber: LoadingStatusSubscriber): void;
    unsubscribe(subscriber: LoadingStatusSubscriber): void;
    private notify;
}
declare const loadingStatus: LoadingStatus;

export { LoadingStatus, type LoadingStatusSubscriber, type ProgressInfo, loadingStatus as default };
