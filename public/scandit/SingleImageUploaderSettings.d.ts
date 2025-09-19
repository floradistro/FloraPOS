/// <reference types="emscripten" />
import * as CSS from 'csstype';
import { Serializable } from './private/Serializable.js';

interface SingleImageUploaderSettingsJSON {
    iconElement: string;
    informationElement: string;
    buttonElement: string;
    containerStyle: CSS.Properties;
    iconStyle: CSS.Properties;
    informationStyle: CSS.Properties;
    buttonStyle: CSS.Properties;
    onlyCameraCapture: boolean;
}
declare class SingleImageUploaderSettings implements Serializable<SingleImageUploaderSettingsJSON> {
    iconElement: HTMLElement | SVGElement;
    informationElement: HTMLElement;
    buttonElement: HTMLElement;
    containerStyle: CSS.Properties;
    iconStyle: CSS.Properties;
    informationStyle: CSS.Properties;
    buttonStyle: CSS.Properties;
    /**
     * On mobile, when true, requests that the device's camera be used instead of requesting a file input.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
     */
    onlyCameraCapture: boolean;
    constructor(settings: SingleImageUploaderSettings | null);
    private static fromJSON;
    toJSONObject(): SingleImageUploaderSettingsJSON;
}

export { SingleImageUploaderSettings, type SingleImageUploaderSettingsJSON };
