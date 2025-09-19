/// <reference types="emscripten" />
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';
import { Card } from './Card.js';
import '../../../Common.js';
import '../../Serializable.js';

declare enum CardListEvents {
    Collapsed = "collapsed",
    WillCollapse = "willcollapse",
    Expanded = "expanded",
    WillExpand = "willexpand",
    Tap = "cardtap"
}
declare class CardList extends ScanditHTMLElement {
    static tag: "scandit-card-list";
    private static readonly observedAttributes;
    private onCardClickHandler;
    private updateFadeMaskHandler;
    constructor();
    set collapsed(value: boolean);
    get collapsed(): boolean;
    private get items();
    private get root();
    static create(): CardList;
    static register(): void;
    private static createStyleElement;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: keyof this, _oldValue: this[keyof this], _newValue: this[keyof this]): void;
    private _handleStateChange;
    expand(): Promise<void>;
    collapse(): Promise<void>;
    private updateListHeight;
    renderCards(items: Card[]): void;
    clearCards(): void;
    /**
     * put the card on the top of the list and animate it
     */
    unshift(item: Card): Promise<void>;
    private onCardClick;
    private updateFadeMask;
}
declare global {
    interface HTMLElementTagNameMap {
        [CardList.tag]: CardList;
    }
    interface HTMLElementEventMap {
        [CardListEvents.Collapsed]: CustomEvent<void>;
        [CardListEvents.Expanded]: CustomEvent<void>;
        [CardListEvents.WillExpand]: CustomEvent<void>;
        [CardListEvents.WillCollapse]: CustomEvent<void>;
        [CardListEvents.Tap]: CustomEvent<{
            card: Card;
        }>;
    }
}

export { CardList, CardListEvents };
