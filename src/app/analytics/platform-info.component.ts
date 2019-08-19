import { Component } from "@angular/core";
import * as myGlobals from '../globals';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "platform-info",
    templateUrl: "./platform-info.component.html",
    styleUrls: ["./platform-info.component.css"]
})

export class PlatformInfoComponent {

    config = myGlobals.config;

    constructor(private translate: TranslateService,
    ) {
        translate.setDefaultLang("en");
        translate.use(translate.getBrowserLang());
    }

}
