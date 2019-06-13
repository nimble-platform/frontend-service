"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var platform_browser_dynamic_1 = require("@angular/platform-browser-dynamic");
var i18n_provider_1 = require("./app/i18n-provider");
var app_module_1 = require("./app/app.module");
var myGlobals = require("./app/globals");
var core_1 = require("@angular/core");
i18n_provider_1.getTranslationProviders().then(function (providers) {
    var options = { providers: providers };
    if (!myGlobals.debug)
        core_1.enableProdMode();
    //platformBrowserDynamic().bootstrapModule(AppModule, options);
    platform_browser_dynamic_1.platformBrowserDynamic().bootstrapModule(app_module_1.AppModule);
});
//# sourceMappingURL=main.js.map