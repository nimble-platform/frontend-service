import { Component } from "@angular/core";
import * as myGlobals from '../globals';

@Component({
    selector: "platform-info",
    templateUrl: "./platform-info.component.html",
    styleUrls: ["./platform-info.component.css"]
})

export class PlatformInfoComponent {

    config = myGlobals.config;

    constructor(
    ) {}

}
