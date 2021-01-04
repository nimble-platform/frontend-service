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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Demand} from '../../catalogue/model/publish/demand';
import {selectNameFromLabelObject, selectPartyName, selectPreferredValue} from '../../common/utils';
import {Router} from '@angular/router';
import {DemandService} from '../demand-service';
import {CallStatus} from '../../common/call-status';
import {DemandPublishService} from '../demand-publish-service';
import {CategoryService} from '../../catalogue/category/category.service';
import {CategoryModelUtils} from '../../catalogue/model/model-util/category-model-utils';
import {Category} from '../../catalogue/model/category/category';
import {BPEService} from '../../bpe/bpe.service';
import {UserService} from '../../user-mgmt/user.service';
import {FEDERATIONID} from '../../catalogue/model/constants';
import {CookieService} from 'ng2-cookies';
import {Party} from '../../catalogue/model/publish/party';
import {CountryUtil} from '../../common/country-util';
import {AppComponent} from '../../app.component';

@Component({
    selector: 'demand-list-item',
    templateUrl: './demand-list-item.component.html'
})
export class DemandListItemComponent {
    @Input() demand: Demand;
    @Input() leafCategory: any;
    @Input() showActionButtons = false;
    @Input() companyData: any;
    @Output() onDemandDeleted: EventEmitter<void> = new EventEmitter<void>();

    isLoggedIn: boolean;
    buyerParty: Party;
    userCompanyId: string;

    callStatus: CallStatus;

    selectNameFromLabelObject = selectNameFromLabelObject;
    selectPreferredValue = selectPreferredValue;
    selectPartyName = selectPartyName;
    getCountryByISO = CountryUtil.getCountryByISO;

    constructor(
        private demandService: DemandService,
        private demandPublishService: DemandPublishService,
        private categoryService: CategoryService,
        private bpeService: BPEService,
        private userService: UserService,
        private cookieService: CookieService,
        private appComponent:AppComponent,
        private router: Router
    ) {
    }

    ngOnInit(): void {
        this.isLoggedIn = !!this.cookieService.get('user_id')
        this.userCompanyId = this.cookieService.get('company_id');
        if (this.isLoggedIn) {
            this.getOwnerCompanyDetails();
        }
    }

    onEditClicked(): void {
        this.demandPublishService.modifiedDemand = this.demand;
        // TODO we can get the taxonomy details from the backend
        // taxonomy id is explicitly set for the category as it is not available in the category information obtained from the index.
        const selectedCategory: Category = CategoryModelUtils.transformIndexCategoryToDbCategory(this.leafCategory);
        selectedCategory.taxonomyId = this.demand.itemClassificationCode.find(cat => cat.uri === selectedCategory.categoryUri).listID;
        this.categoryService.selectedCategories = [selectedCategory];
        this.router.navigate(['/demand/publish'], {queryParams: {publishMode: 'edit'}});
    }

    onDeleteClicked(): void {
        this.appComponent.confirmModalComponent.open(this.appComponent.translate.instant("Are you sure that you want to delete this demand ?")).then(response => {
            if(response){
                this.callStatus = new CallStatus();
                this.callStatus.submit();
                this.demandService.deleteDemand(this.demand.hjid).then(() => {
                    this.onDemandDeleted.emit();
                    this.callStatus.callback(null, true);
                }).catch(e => {
                    this.callStatus.error('Failed to delete demand', e);
                })
            }
        })
    }

    onLoginClicked(): void {
        this.router.navigate(['/user-mgmt/login'], { queryParams: { redirectURL: this.router.url } });
    }


    private getOwnerCompanyDetails(): void {
        this.userService.getParty(this.demand.metadata.ownerCompany[0]).then(party => {
            this.buyerParty = party;
        });
    }

    onContactClicked(): void {
        this.demandService.createInterestActivity(this.demand.hjid);
        this.router.navigate(['/user-mgmt/company-details'], {queryParams: {id: this.companyData.id}})
    }
}
