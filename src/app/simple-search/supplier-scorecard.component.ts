/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, Input, OnInit } from '@angular/core';
import { SimpleSearchService } from './simple-search.service';
import { UserService } from '../user-mgmt/user.service';
import { CallStatus } from '../common/call-status';
import * as myGlobals from '../globals';

@Component({
    selector: 'supplier-scorecard',
    templateUrl: './supplier-scorecard.component.html'
})
export class SupplierScorecardComponent implements OnInit {

    @Input() companyId: string;

    companySettings: any = null;
    productCount: number = null;
    callStatus: CallStatus = new CallStatus();

    config = myGlobals.config;

    constructor(
        private userService: UserService,
        private searchService: SimpleSearchService
    ) {}

    ngOnInit() {
        if (!this.companyId) { return; }
        this.callStatus.submit();

        Promise.all([
            this.userService.getSettingsForParty(String(this.companyId)),
            this.searchService.getCompanyBasedProductsAndServices(
                'manufacturerId:' + this.companyId, [], [], 1, '', ''
            )
        ]).then(([settings, products]) => {
            this.companySettings = settings;
            this.productCount = (products && products.totalElements) ? products.totalElements : 0;
            this.callStatus.callback('', true);
        }).catch(err => {
            this.callStatus.error('Failed to load scorecard', err);
        });
    }

    selectValue(textObj: any): string {
        if (!textObj) { return ''; }
        if (typeof textObj === 'string') { return textObj; }
        if (textObj.value) { return textObj.value; }
        return textObj['en'] || textObj[Object.keys(textObj)[0]] || '';
    }

    getYearsActive(): string {
        const year = this.companySettings && this.companySettings.details && this.companySettings.details.yearOfCompanyRegistration;
        if (!year) { return '-'; }
        const years = new Date().getFullYear() - parseInt(year, 10);
        return years + ' years (since ' + year + ')';
    }
}
