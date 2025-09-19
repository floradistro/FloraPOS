/// <reference types="emscripten" />
import { Serializable } from './private/Serializable.js';
import { SoundJSON, Sound } from './Sound.js';
import { VibrationJSON, Vibration } from './Vibration.js';

interface FeedbackJSON {
    vibration?: VibrationJSON;
    sound?: SoundJSON;
}
declare class Feedback implements Serializable<FeedbackJSON> {
    private readonly _vibration;
    private readonly _sound;
    constructor(vibration: Vibration | null, sound: Sound | null);
    static get defaultFeedback(): Feedback;
    get vibration(): Vibration | null;
    get sound(): Sound | null;
    emit(): void;
    toJSONObject(): FeedbackJSON;
}

export { Feedback, type FeedbackJSON };
