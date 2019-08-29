import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import * as myGlobals from './app/globals';
import { enableProdMode } from '@angular/core';

	if (!myGlobals.debug)
		enableProdMode();
	//platformBrowserDynamic().bootstrapModule(AppModule, options);
	platformBrowserDynamic().bootstrapModule(AppModule, {preserveWhitespaces: true});
