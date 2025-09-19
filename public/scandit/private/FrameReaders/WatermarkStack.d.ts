/// <reference types="emscripten" />
/**
 * This class represents a modified stack data structure that grows dynamically if consumed too soon.
 * A modified stack is a stack that has an additional operation: unshift.
 * Unshift inserts an element at the bottom of the stack, shifting all the other elements up by one position.
 * The capacity is fixed, determined at construction time.
 * If it reaches its maximum capacity, it cannot push or unshift any more elements, and it will return undefined.
 * If is below a low watermark level, determined by the constructor parameter,
 * it will refill itself by unshifting new elements created by a function, also provided by the constructor parameter.
 * This way, the modified stack can always have enough elements to pop when needed.
 * Can be visualized this way:
 * - item -> pop last item
 * - item
 * - item
 * - item
 * - item
 * - item
 *   --- watermark --- when we reach this level we refill by unshifting.
 * - item
 * - item
 * - item <- recycling
 * @export
 */
declare class WatermarkStack<T> {
    private items;
    private readonly capacity;
    private readonly lowWaterMark;
    private readonly createItem;
    constructor(options: {
        capacity: number;
        lowWaterMark: number;
        createItem: () => T;
    });
    get length(): number;
    pop(): T;
    push(item: T): number | undefined;
    empty(): void;
    private isBelowOrEqualWaterMark;
}

export { WatermarkStack };
