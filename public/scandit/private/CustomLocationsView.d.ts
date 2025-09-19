/// <reference types="emscripten" />
import { SizeJSON, Anchor, PointWithUnit } from '../Common.js';
import { View } from './View.js';
import { AnchorPositions } from './AnchorPositions.js';
import './Serializable.js';

interface DidTapCustomLocationsViewListener {
    didTapView: (identifier: number) => void;
}
interface Item {
    identifier: number;
    anchorPositions: AnchorPositions;
    view: {
        data: string;
        options: {
            size: SizeJSON;
            scale?: number;
        };
    };
    anchor: Anchor;
    offset: PointWithUnit;
}
interface ItemDomView {
    identifier: string;
    anchorPositions: AnchorPositions;
    view: HTMLElement | null;
    anchor: Anchor;
    offset: PointWithUnit;
}
interface StateToRender {
    removedIds: string[];
    elements: Item[];
}
interface StateToRenderDomView {
    elements: ItemDomView[];
}
declare class CustomLocationsView implements View {
    private static readonly componentName;
    private static readonly elementSelectorPrefix;
    listener: DidTapCustomLocationsViewListener | null;
    private _mounted;
    private _htmlRoot;
    private _mirrored;
    private gestureRecognizer;
    private _cachedSize;
    private resizeObserver;
    private get size();
    setMirrored(mirrored: boolean): void;
    mount(htmlRoot: HTMLElement): void;
    unmount(): void;
    render(state: StateToRender): void;
    renderDomView(state: StateToRenderDomView): void;
    mapViewAnchorPositionsForFramePoint: (anchorPositions: AnchorPositions) => AnchorPositions;
    private removeChildren;
    private adjustCoordinatesWithOffset;
}

export { CustomLocationsView, type DidTapCustomLocationsViewListener, type StateToRender, type StateToRenderDomView };
