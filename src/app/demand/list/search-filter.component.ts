/*
 * Copyright 2020
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

import {Component, Input, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {CookieService} from 'ng2-cookies';
import {Router} from '@angular/router';
import {DemandService} from '../demand-service';
import {Demand} from '../../catalogue/model/publish/demand';

@Component({
    selector: 'demand-list',
    templateUrl: './demand-list.component.html'
})
export class DemandListComponent implements OnInit {
    @Input() demands: Demand[];

    constructor(
        private demandService: DemandService,
        private cookieService: CookieService,
        private translate: TranslateService,
        private router: Router
    ) { }

    ngOnInit() {
        this.demandService.getDemands(this.cookieService.get('company_id')).then(demands => {
            console.log('DEMANDS', demands);
        });
    }
}
