import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { getTranslationProviders } from './app/i18n-provider';
import { AppModule } from './app/app.module';
import * as myGlobals from './app/globals';
import { enableProdMode } from '@angular/core';

getTranslationProviders().then(providers => {
	const options = { providers };
	if (!myGlobals.debug)
		enableProdMode();
	platformBrowserDynamic().bootstrapModule(AppModule, options);
});