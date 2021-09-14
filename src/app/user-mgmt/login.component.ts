/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import {Component, OnDestroy, OnInit, Renderer2} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as myGlobals from '../globals';
import { DEFAULT_LANGUAGE } from '../catalogue/model/constants';

@Component({
    selector: 'nimble-login',
    templateUrl: './login.component.html'
})


export class LoginComponent implements OnInit, OnDestroy {
    public pageRef: string = null;
    config = myGlobals.config;
    disclaimer = "";

    constructor(
        private route: ActivatedRoute,
        private renderer: Renderer2) {
        this.renderer.setStyle(document.body, "background-image", "url('assets/bg_login.jpg')");
    }

    ngOnInit() {
        this.route
            .queryParams
            .subscribe(params => {
                this.pageRef = params['pageRef'];
            });
        if (this.config.demo.enabled) {
            if (this.config.demo.disclaimer[DEFAULT_LANGUAGE()])
                this.disclaimer = this.config.demo.disclaimer[DEFAULT_LANGUAGE()];
            else
                this.disclaimer = this.config.demo.disclaimer["en"];
        }
    }

    ngOnDestroy() {
        this.renderer.setStyle(document.body, "background-image", "url('assets/bg_global.jpg')");
    }
}
