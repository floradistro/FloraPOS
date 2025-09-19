/// <reference types="emscripten" />
declare function throttle<T extends (...arguments_: any[]) => any>(function_: T, limit: number): (this: ThisParameterType<T>, ...arguments_: Parameters<T>) => void;

export { throttle };
