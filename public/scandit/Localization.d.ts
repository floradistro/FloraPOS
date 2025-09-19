/// <reference types="emscripten" />
import { Translations } from './translations.js';
import { DistributiveKeyOf } from './tsHelper.js';

type LocalizationSubscriber = (translations: Partial<Record<DistributiveKeyOf<Translations>, string>>) => void;
interface LocalizationSubscription {
    cancel(): void;
}
declare class Localization {
    private static instance?;
    private translations;
    private subscribers;
    static getInstance(): Localization;
    /**
     * @description Given a key, returns a single translation. You can pass a generic to define the scope of the
     * translations you have.
     *
     * @example
     * // When using the barcode module
     * Localization.getInstance().get<SDCCore.Translations | SDCBarcode.Translations>("core.camera.recovery")
     *
     * @param key One of the keys of the passed Generic interface
     * @returns the corresponding translation, or an empty string if the key was not found.
     */
    get<K = Translations>(key: keyof K): string;
    /**
     * @returns An object containing all the translations
     */
    getAll<K extends object = Translations>(): Record<DistributiveKeyOf<K>, string>;
    /**
     * @description Update the translations with the given object.
     * @param {object} translations An object containing all or a subset of all translations
     */
    update<K extends object = Translations>(translations: Partial<Record<DistributiveKeyOf<K>, string>>): void;
    /**
     * @description Update all translations that are passed in argument but only if not already present. Useful to avoid
     * overwriting translation that the customer may have set early in the code.
     * @param {object} translations An object containing all or a subset of all translations
     */
    updateIfMissing<K extends object = Translations>(translations: Partial<Record<DistributiveKeyOf<K>, string>>): void;
    private subscribe;
}

export { Localization, type LocalizationSubscriber, type LocalizationSubscription };
