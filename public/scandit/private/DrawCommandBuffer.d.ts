/// <reference types="emscripten" />
declare enum DrawCommandEnum {
    AddLine = 0,
    AddArc = 1,
    AddCircle = 2,
    AddRect = 3,
    AddRoundedRect = 4,
    BeginPath = 5,
    ClosePath = 6,
    Fill = 7,
    Stroke = 8,
    Clear = 9,
    SetStrokeWidth = 10,
    SetFillColor = 11,
    SetStrokeColor = 12,
    MoveTo = 13,
    LineTo = 14,
    SaveState = 15,
    RestoreState = 16,
    Translate = 17,
    ScaleAroundPoint = 18,
    BezierTo = 19,
    Transform = 20,
    Scale = 21,
    AddPathWinding = 22
}
interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}
declare class DrawCommandBuffer {
    private _view;
    private _index;
    constructor(stream: Uint8Array);
    extractCommandType(): DrawCommandEnum;
    extractFloat(): number;
    extractBoolean(): boolean;
    extractColor(): Color;
    isConsumed(): boolean;
}

export { type Color, DrawCommandBuffer, DrawCommandEnum };
