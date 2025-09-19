/// <reference types="emscripten" />
/**
 * Creates a valid DOM ID from a list of values.
 *
 * This function takes an array of values and creates a deterministic, valid DOM ID.
 * The resulting ID is human-readable and follows HTML5 ID rules.
 *
 * @param values - Array of string values to create an ID from
 * @param prefix - Optional prefix for the ID (defaults to "id")
 * @returns A valid DOM ID string
 *
 * @example
 * domIdFromValues(["red", "white", "center"]) // Returns "id-red-white-center"
 * domIdFromValues(["Toast", "Move Closer!"], "hint") // Returns "hint-toast-move_closer"
 */
declare function domIdFromValues(values: string[], prefix?: string): string;

export { domIdFromValues };
