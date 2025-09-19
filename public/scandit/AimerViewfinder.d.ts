/// <reference types="emscripten" />
import { Color } from './Common.js';
import { Viewfinder } from './Viewfinder.js';
import { AimerViewfinderJSON } from './ViewfinderPlusRelated.js';
import { Serializable } from './private/Serializable.js';
import './private/nativeHandle.js';

declare class AimerViewfinder implements Viewfinder, Serializable<AimerViewfinderJSON> {
    frameColor: Color;
    dotColor: Color;
    private readonly type;
    constructor();
    toJSONObject(): AimerViewfinderJSON;
}

export { AimerViewfinder };
