/// <reference types="emscripten" />
declare function waitTransitionEndForElement(element: HTMLElement, propertyName: string): Promise<TransitionEvent>;

export { waitTransitionEndForElement };
