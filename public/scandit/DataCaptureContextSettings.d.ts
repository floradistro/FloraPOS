/// <reference types="emscripten" />
import { JSONType } from './Common.js';
import { Serializable } from './private/Serializable.js';

type DataCaptureContextSettingsJSON = Record<string, JSONType>;
declare class DataCaptureContextSettings implements Serializable<DataCaptureContextSettingsJSON> {
    constructor();
    setProperty(name: string, value: any): void;
    getProperty(name: string): any;
    toJSONObject(): DataCaptureContextSettingsJSON;
}

export { DataCaptureContextSettings, type DataCaptureContextSettingsJSON };
