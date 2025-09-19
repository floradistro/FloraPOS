/// <reference types="emscripten" />
interface Serializable<T = Record<string, any>> {
    toJSONObject: () => T;
}
interface StringSerializable {
    toJSON: () => string;
}

export type { Serializable, StringSerializable };
