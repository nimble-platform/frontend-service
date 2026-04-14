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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Demand} from '../../catalogue/model/publish/demand';
import {selectNameFromLabelObject, selectPartyName, selectPreferredValue} from '../../common/utils';
import {Router} from '@angular/router';
import {DemandService} from '../demand-service';
import {CallStatus} from '../../common/call-status';
import {DemandPublishService} from '../demand-publish-service';
import {CategoryService} from '../../catalogue/category/category.service';
import {CategoryModelUtils} from '../../catalogue/model/model-util/category-model-utils';
import {Category} from '../../common/model/category/category';
import {BPEService} from '../../bpe/bpe.service';
import {UserService} from '../../user-mgmt/user.service';
import {FEDERATIONID} from '../../catalogue/model/constants';
import {CookieService} from 'ng2-cookies';
import {Party} from '../../catalogue/model/publish/party';
import {CountryUtil} from '../../common/country-util';
import {AppComponent} from '../../app.component';
import {TranslateService} from '@ngx-translate/core';
import * as myGlobals from '../../globals';
import {Certificate} from '../../catalogue/model/publish/certificate';
import { Text } from '../../catalogue/model/publish/text';
import {CatalogueService} from '../../catalogue/catalogue.service';

@Component({
    selector: 'demand-list-item',
    templateUrl: './demand-list-item.component.html',
    styleUrls: ['./demand-list-item.component.css']
})
export class DemandListItemComponent {
    @Input() demand: Demand;
    @Input() leafCategory: any;
    @Input() showActionButtons = false;
    @Input() companyData: any;
    @Output() onDemandDeleted: EventEmitter<void> = new EventEmitter<void>();

    // circular economy and arbitrary certificates of demand
    circularEconomyCertificates: Certificate[] = [];
    arbitraryCertificates: Certificate[] = [];

    isLoggedIn: boolean;
    buyerParty: Party;
    userCompanyId: string;

    callStatus: CallStatus;

    selectNameFromLabelObject = selectNameFromLabelObject;
    selectPartyName = selectPartyName;
    getCountryByISO = CountryUtil.getCountryByISO;
    // flag if the demand is new for the user or not
    isNewDemand:boolean = true;
    // flag if the certificates are displayed
    displayCertificates:boolean = false;

    config = myGlobals.config;

    // HCDP-03-03: Propose Offer (supplier side)
    showProposeModal: boolean = false;
    supplierProducts: any[] = [];
    selectedProduct: any = null;
    offerMessage: string = '';
    offerCallStatus: CallStatus = new CallStatus();
    loadProductsCallStatus: CallStatus = new CallStatus();

    // HCDP-03-03: View Responses (buyer side)
    showResponses: boolean = false;
    demandResponses: any[] = [];
    responseCount: number = 0;
    responseCallStatus: CallStatus = new CallStatus();
    deleteResponseCallStatus: CallStatus = new CallStatus();

    constructor(
        private demandService: DemandService,
        private demandPublishService: DemandPublishService,
        private categoryService: CategoryService,
        private translateService: TranslateService,
        private bpeService: BPEService,
        private userService: UserService,
        private catalogueService: CatalogueService,
        private cookieService: CookieService,
        private appComponent:AppComponent,
        private router: Router
    ) {
    }

    ngOnInit(): void {
        this.isLoggedIn = !!this.cookieService.get('user_id')
        this.userCompanyId = this.cookieService.get('company_id');
        // mark the demand as new if the user has not seen it before
        if(this.demand.metadata.ownerCompany[0] === this.userCompanyId || (this.demandService.demandLastSeenResponse.lastSeenDemandId && this.demandService.demandLastSeenResponse.lastSeenDemandId >= this.demand.hjid)){
            this.isNewDemand = false;
        }
        if (this.isLoggedIn) {
            this.getOwnerCompanyDetails();
            // HCDP-03-03: pre-load response count for buyer's own demands
            if (this.showActionButtons) {
                this.demandService.getDemandResponses(this.demand.hjid).then(responses => {
                    this.demandResponses = responses || [];
                    this.responseCount = this.demandResponses.length;
                }).catch(() => { this.responseCount = 0; });
            }
        }
        // initialize circular economy and arbitrary demand certificates if they exist
        if(this.demand.certificate && this.demand.certificate.length){
            this.demand.certificate.forEach(cert => {
                if (cert.certificateType === this.config.circularEconomy.certificateGroup) {
                    this.circularEconomyCertificates.push(cert);
                } else {
                    this.arbitraryCertificates.push(cert);
                }
            });
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

    // HCDP-03-02: Navigate to product search pre-filtered by this demand's category
    // Buyer can quickly find matching products to send RFQs for this tender.
    onFindSuppliersClicked(): void {
        const categoryUri  = this.demand.itemClassificationCode && this.demand.itemClassificationCode.length > 0
            ? this.demand.itemClassificationCode[0].uri : '';
        const categoryName = this.leafCategory ? selectNameFromLabelObject(this.leafCategory.label) : '';
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: '*',
                p: 1,
                cat: categoryName,
                catID: categoryUri,
                sTop: 'prod'
            }
        });
    }


    private getOwnerCompanyDetails(): void {
        this.userService.getParty(this.demand.metadata.ownerCompany[0]).then(party => {
            this.buyerParty = party;
        });
    }

    onContactClicked(companyData): void {
        // create interest activity for the demand
        this.demandService.createInterestActivity(this.demand.hjid);
        // Navigate to buyer's company profile page so supplier can review details and initiate RFQ
        this.router.navigate(['/user-mgmt/company-details'], {
            queryParams: {
                id: companyData.id,
                delegateId: FEDERATIONID()
            }
        });
    }

    getPreferredValue(texts:Text[]){
        return selectPreferredValue(texts, this.translateService.currentLang);
    }

    // =========================================================================
    // HCDP-03-03: Propose Offer (supplier side)
    // =========================================================================

    onProposeOfferClicked(): void {
        this.showProposeModal = true;
        this.selectedProduct = null;
        this.offerMessage = '';
        this.offerCallStatus = new CallStatus();
        if (this.supplierProducts.length === 0) {
            this.loadProductsCallStatus.submit();
            const userId = this.cookieService.get('user_id');
            this.catalogueService.getCatalogueResponse(userId, null, null, 50).then(res => {
                this.supplierProducts = (res && res.catalogueLines) ? res.catalogueLines : [];
                this.loadProductsCallStatus.callback(null, true);
            }).catch(e => {
                this.loadProductsCallStatus.error('Failed to load products', e);
            });
        }
    }

    onSelectProduct(product: any): void {
        this.selectedProduct = product;
    }

    getProductDisplayName(product: any): string {
        if (!product) { return ''; }
        if (product.goodsItem && product.goodsItem.item && product.goodsItem.item.name && product.goodsItem.item.name.length > 0) {
            return product.goodsItem.item.name[0].value;
        }
        return product.id || '';
    }

    onSubmitOffer(): void {
        if (!this.selectedProduct) { return; }
        this.offerCallStatus.submit();
        const userId = this.cookieService.get('user_id');
        this.userService.getSettingsForParty(this.userCompanyId).then(settings => {
            let companyName: string = this.userCompanyId;
            if (settings && settings.details && settings.details.legalName) {
                const ln = settings.details.legalName;
                companyName = typeof ln === 'string' ? ln : (Object.values(ln as object)[0] as string) || this.userCompanyId;
            }
            const payload = {
                responderCompanyName: companyName,
                catalogueLineHjid: this.selectedProduct.hjid,
                catalogueUuid: this.selectedProduct.goodsItem && this.selectedProduct.goodsItem.item ?
                    this.selectedProduct.goodsItem.item.catalogueDocumentReference ?
                        this.selectedProduct.goodsItem.item.catalogueDocumentReference.id : '' : '',
                lineId: this.selectedProduct.id || '',
                productName: this.getProductDisplayName(this.selectedProduct),
                message: this.offerMessage
            };
            return this.demandService.submitDemandResponse(this.demand.hjid, payload);
        }).then(() => {
            this.offerCallStatus.callback(null, true);
            // Delay closing the modal so the 'Offer submitted!' flash is briefly visible (U20)
            setTimeout(() => { this.showProposeModal = false; }, 1500);
        }).catch(e => {
            this.offerCallStatus.error(this.translateService.instant('Failed to submit offer'), e);
        });
    }

    onCancelPropose(): void {
        this.showProposeModal = false;
    }

    // =========================================================================
    // HCDP-03-03: View Responses (buyer side)
    // =========================================================================

    onViewResponsesClicked(): void {
        this.showResponses = !this.showResponses;
    }

    onViewProductClicked(response: any): void {
        if (response.catalogueUuid && response.lineId) {
            this.router.navigate(['/product-details'], {
                queryParams: { catalogueId: response.catalogueUuid, id: response.lineId }
            });
        }
    }

    onSendRfqClicked(response: any): void {
        // Navigate to product search to find the specific product and initiate RFQ
        if (response.lineId) {
            this.router.navigate(['/simple-search'], {
                queryParams: { q: response.productName || '*', p: 1, sTop: 'prod' }
            });
        }
    }

    onDeleteResponseClicked(response: any): void {
        this.appComponent.confirmModalComponent.open(
            this.translateService.instant('Are you sure you want to remove this offer?')
        ).then(confirmed => {
            if (confirmed) {
                this.demandService.deleteDemandResponse(this.demand.hjid, response.hjid).then(() => {
                    this.demandResponses = this.demandResponses.filter(r => r.hjid !== response.hjid);
                    this.responseCount = this.demandResponses.length;
                }).catch(e => console.error('Failed to delete demand response', e));
            }
        });
    }
}
