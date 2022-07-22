/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import {Component, OnInit} from '@angular/core';
import * as myGlobals from '../globals';
import {DEFAULT_LANGUAGE} from '../catalogue/model/constants';

@Component({
    selector: "platform-info",
    templateUrl: "./platform-info.component.html",
    styleUrls: ["./platform-info.component.css"]
})

export class PlatformInfoComponent implements OnInit{

    config = myGlobals.config;

    imprint = null;

    constructor() {
    }

    ngOnInit() {
        if (this.config.imprint[DEFAULT_LANGUAGE()])
            this.imprint = this.config.imprint[DEFAULT_LANGUAGE()];
        else
            this.imprint = this.config.imprint["en"];
    }
}
