/// <reference types="emscripten" />
declare function debounce<T extends (...arguments_: any[]) => any>(function_: T, delay?: number): (...arguments_: Parameters<T>) => void;

export { debounce };
