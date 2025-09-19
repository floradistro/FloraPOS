/// <reference types="emscripten" />
declare const translations: {
    "core.view.loading": string;
    "core.singleImageUploader.title": string;
    "core.singleImageUploader.button": string;
    "core.camera.recovery": string;
    "barcode.find.view.textForCollapseCardsButton": string;
};
type Translations = typeof translations;
type TranslationKey = keyof Translations;

export { type TranslationKey, type Translations, translations };
