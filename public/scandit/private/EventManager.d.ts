/// <reference types="emscripten" />
declare class EventManager<ListenerType> {
    protected readonly _listeners: Set<ListenerType>;
    protected get listeners(): ListenerType[];
    addListener(listener: ListenerType): void;
    removeListener(listener: ListenerType): void;
}

export { EventManager as default };
