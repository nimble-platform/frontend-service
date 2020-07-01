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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {AppComponent} from '../app.component';

@Component({
    selector: 'simple-search',
    templateUrl: './simple-search.component.html'
})

export class SimpleSearchComponent implements OnInit {

    pageRef = '';

    constructor(private route: ActivatedRoute,
                private appComponent: AppComponent,
                private translate: TranslateService,) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.pageRef = params['pageRef'];
        });
    }

    canDeactivate(nextState: RouterStateSnapshot): boolean | Promise<boolean>{
        if (this.pageRef === 'publish' && !nextState.url.startsWith('/catalogue/publish')) {
            return this.appComponent.confirmModalComponent.open('You will lose any changes you made, are you sure you want to quit ?').then(result => {
                return result;
            });
        } else{
            return true;
        }
    }
}
