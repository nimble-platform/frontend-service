"use strict";
var core_1 = require('@angular/core');
function getTranslationProviders() {
    // Get the locale id from the global
    var locale = document['locale'];
    // return no providers if fail to get translation file for locale
    var noProviders = [];
    // No locale or U.S. English: no translation providers
    if (!locale || locale === 'en') {
        return Promise.resolve(noProviders);
    }
    // Ex: 'locale/messages.es.xlf`
    var translationFile = "./locale/messages." + locale + ".xlf";
    return getTranslationsWithSystemJs(translationFile)
        .then(function (translations) { return [
        { provide: core_1.TRANSLATIONS, useValue: translations },
        { provide: core_1.TRANSLATIONS_FORMAT, useValue: 'xlf' },
        { provide: core_1.LOCALE_ID, useValue: locale }
    ]; })
        .catch(function () { return noProviders; }); // ignore if file not found
}
exports.getTranslationProviders = getTranslationProviders;
function getTranslationsWithSystemJs(file) {
    return System.import(file + '!text'); // relies on text plugin
}
//# sourceMappingURL=i18n-provider.js.map