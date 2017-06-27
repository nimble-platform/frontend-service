"use strict";
var platform_browser_dynamic_1 = require('@angular/platform-browser-dynamic');
var i18n_provider_1 = require('./app/i18n-provider');
var app_module_1 = require('./app/app.module');
i18n_provider_1.getTranslationProviders().then(function (providers) {
    var options = { providers: providers };
    platform_browser_dynamic_1.platformBrowserDynamic().bootstrapModule(app_module_1.AppModule, options);
});
//# sourceMappingURL=main.js.map