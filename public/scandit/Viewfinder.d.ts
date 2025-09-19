/// <reference types="emscripten" />
import { ViewfinderJSON } from './ViewfinderPlusRelated.js';
import { Serializable } from './private/Serializable.js';
import { nativeHandle } from './private/nativeHandle.js';
import './Common.js';

interface Viewfinder {
    [nativeHandle]?: {
        className: string;
        id: number;
    };
    toJSONObject: () => ViewfinderJSON;
}
declare class NoneViewfinder implements Viewfinder, Serializable<ViewfinderJSON> {
    private readonly type;
    toJSONObject(): ViewfinderJSON;
}
declare const NoViewfinder: NoneViewfinder;

export { NoViewfinder, type Viewfinder };
