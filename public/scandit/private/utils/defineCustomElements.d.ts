/// <reference types="emscripten" />
declare function defineCustomElements(elements: Partial<Record<keyof HTMLElementTagNameMap, CustomElementConstructor>>): void;

export { defineCustomElements };
