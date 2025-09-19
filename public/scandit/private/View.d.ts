/// <reference types="emscripten" />
interface View {
    mount: (root: HTMLElement) => void;
    unmount: () => void;
}

export type { View };
