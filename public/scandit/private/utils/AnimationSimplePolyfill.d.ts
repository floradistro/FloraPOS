/// <reference types="emscripten" />
declare class MockAnimation extends EventTarget implements Animation {
    private __isMockAnimation;
    private element;
    private keyFrameEffect;
    private _playState;
    get playState(): AnimationPlayState;
    get replaceState(): AnimationReplaceState;
    private resolver;
    private readyResolver;
    private timeoutId;
    finished: Promise<any>;
    timeline: AnimationTimeline | null;
    effect: AnimationEffect | null;
    id: string;
    pending: boolean;
    playbackRate: number;
    private _replaceState;
    ready: Promise<any>;
    startTime: number | null;
    currentTime: number | null;
    constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null);
    play(): void;
    pause(): void;
    finish(): void;
    cancel(): void;
    reverse(): void;
    onfinish: (() => void) | null;
    oncancel: (() => void) | null;
    onremove: (() => void) | null;
    private createReadyPromise;
    private applyFinalStyles;
    private cleanupAppliedStyles;
    commitStyles(): void;
    persist(): void;
    updatePlaybackRate(playbackRate: number): void;
    get overallProgress(): number;
}
declare class MockKeyframeEffect implements KeyframeEffect {
    target: Element | null;
    keyframes: Keyframe[];
    options: KeyframeEffectOptions;
    activeDuration: number;
    composite: CompositeOperation;
    pseudoElement: string | null;
    iterationComposite: IterationCompositeOperation;
    constructor(targetOrSource: Element | null | KeyframeEffect, keyframes?: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeEffectOptions);
    private normalizeKeyframes;
    calculateActiveDuration(): number;
    getTiming(): EffectTiming;
    updateTiming(timing?: Partial<EffectTiming>): void;
    setKeyframes(newKeyframes: Keyframe[]): void;
    getKeyframes(): ComputedKeyframe[];
    getTarget(): Element | null;
    getComputedTiming(): ComputedEffectTiming;
}
declare function polyfill(): () => void;

export { MockAnimation, MockKeyframeEffect, polyfill };
