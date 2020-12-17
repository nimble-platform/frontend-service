/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
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

import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CatalogueLine } from "../../model/publish/catalogue-line";
import { CatalogueService } from "../../catalogue.service";
import { Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PublishService } from "../../publish-and-aip.service";
import { CategoryService } from "../../category/category.service";
import { ProductWrapper } from "../../../common/product-wrapper";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";
import { CallStatus } from "../../../common/call-status";
import { isLogisticsService, isTransportService } from '../../../common/utils';
import { CompanySettings } from "../../../user-mgmt/model/company-settings";
import { Item } from '../../model/publish/item';
import { selectDescription, selectName } from '../../../common/utils';
import {AppComponent} from '../../../app.component';

@Component({
    selector: 'catalogue-line-panel',
    templateUrl: './catalogue-line-panel.component.html'
})

export class CatalogueLinePanelComponent {

    @Input() catalogueLine: CatalogueLine;
    @Input() settings: CompanySettings;
    @Input() presentationMode: string;
    @Input() offeringProduct:boolean = false;
    // whether the line panel is used in the publishing page
    @Input() linePanelInPublishingPage:boolean = false;

    // check whether catalogue-line-panel should be displayed
    @Input() show = false;
    @Output() showChange = new EventEmitter<boolean>();
    @Output() catalogueLineDeleted = new EventEmitter();
    @Output() catalogueLineOffered = new EventEmitter();

    productWrapper: ProductWrapper;

    constructor(private catalogueService: CatalogueService,
        private categoryService: CategoryService,
        private appComponent: AppComponent,
        private publishService: PublishService,
        private translate: TranslateService,
        private router: Router) {
    }

    selectItemName(item: Item) {
        return selectName(item);
    }

    ngOnInit() {
        this.productWrapper = new ProductWrapper(this.catalogueLine, new CompanyNegotiationSettings());
    }

    redirectToEdit() {
        this.catalogueService.editCatalogueLine(this.catalogueLine);
        this.publishService.resetData("edit");
        this.categoryService.resetSelectedCategories();

        if (isLogisticsService(this.catalogueLine))
            this.router.navigate(['catalogue/publish-logistic']);
        else
            this.router.navigate(['catalogue/publish-single']);
    }

    offerProduct(){
        this.catalogueLineOffered.emit(null);
    }

    deleteCatalogueLine(): void {
        this.catalogueLineDeleted.next(null);
    }

    onLinePanelClicked(){
        if(!this.linePanelInPublishingPage){
            this.show = false;
            this.showChange.emit(false)
        }
    }
}
