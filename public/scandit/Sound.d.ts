/// <reference types="emscripten" />
import { Serializable } from './private/Serializable.js';

interface SoundJSON {
    resource?: string;
}
declare class Sound implements Serializable<SoundJSON> {
    private static _defaultSound;
    resource: string | null;
    private audio;
    constructor(resource: string | null);
    static get defaultSound(): Sound;
    toJSONObject(): SoundJSON;
    private play;
}

export { Sound, type SoundJSON };
