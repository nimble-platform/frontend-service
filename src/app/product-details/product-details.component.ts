import {Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { CatalogueService } from "../catalogue/catalogue.service";
import { CallStatus } from "../common/call-status";
import { BPDataService } from "../bpe/bp-view/bp-data-service";
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import { ProcessType } from "../bpe/model/process-type";
import { ProductWrapper } from "../common/product-wrapper";
import { Item } from "../catalogue/model/publish/item";
import { PriceWrapper } from "../common/price-wrapper";
import {
    getMaximumQuantityForPrice,
    getStepForPrice,
    isTransportService,
    selectPreferredValue,
    roundToTwoDecimals
} from "../common/utils";
import { AppComponent } from "../app.component";
import { UserService } from "../user-mgmt/user.service";
import { CompanySettings } from "../user-mgmt/model/company-settings";
import {Quantity} from '../catalogue/model/publish/quantity';
import {DiscountModalComponent} from './discount-modal.component';
import {BpStartEvent} from '../catalogue/model/publish/bp-start-event';
import {SearchContextService} from '../simple-search/search-context.service';
import {BpURLParams} from '../catalogue/model/publish/bpURLParams';
import { CookieService } from 'ng2-cookies';
import {FAVOURITE_LINEITEM_PUT_OPTIONS} from '../catalogue/model/constants';
import * as myGlobals from '../globals';
import {DiscountPriceWrapper} from "../common/discount-price-wrapper";
import {DigitalAgreement} from "../catalogue/model/publish/digital-agreement";
import {DocumentService} from "../bpe/bp-view/document-service";
import {BPEService} from "../bpe/bpe.service";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {NegotiationModelWrapper} from "../bpe/bp-view/negotiation/negotiation-model-wrapper";

@Component({
    selector: 'product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {

    getProductStatus: CallStatus = new CallStatus();

    id: string;
    catalogueId: string;
    favouriteItemIds: string[] = [];

    options: BpWorkflowOptions = new BpWorkflowOptions();

    line?: CatalogueLine;
    item?: Item;
    productWrapper?: ProductWrapper;
    settings?: CompanySettings;
    productDefaultsDiscountPriceWrapper?: DiscountPriceWrapper;
    frameContractQuotationWrapper: NegotiationModelWrapper;
    frameContract: DigitalAgreement;
    tabToOpen: string = "";
    isLogistics: boolean = false;

    config = myGlobals.config;

    addFavoriteCategoryStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;
    selectPreferredValue = selectPreferredValue;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private catalogueService: CatalogueService,
                private documentService: DocumentService,
                private userService: UserService,
                private route: ActivatedRoute,
                private cookieService: CookieService,
                public appComponent: AppComponent,) {

    }

    ngOnInit() {
        this.bpDataService.setCatalogueLines([], []);
		this.route.queryParams.subscribe(params => {
			let id = params['id'];
            let catalogueId = params['catalogueId'];
            this.tabToOpen = params['tabToOpen'];

            if(id !== this.id || catalogueId !== this.catalogueId) {
                this.id = id;
                this.catalogueId = catalogueId;

                this.getProductStatus.submit();
                this.catalogueService.getCatalogueLine(catalogueId, id)
                    .then(line => {
                        this.line = line;
                        this.item = line.goodsItem.item;
                        this.isLogistics = isTransportService(this.line);

                        // check frame contract for the current line
                        this.bpeService.getFrameContract(UBLModelUtils.getPartyId(this.line.goodsItem.item.manufacturerParty),
                            this.cookieService.get("company_id"),
                            this.line.id).then(contract => {
                            this.frameContract = contract;
                            // contract exists, get the corresponding quotation including the terms
                            this.documentService.getDocumentJsonContent(this.frameContract.quotationReference.id).then(document => {
                                this.frameContractQuotationWrapper = new NegotiationModelWrapper(null, null, document, null);
                            });
                        });

                        return this.userService.getSettingsForProduct(line)
                    })
                    .then(settings => {
                        this.settings = settings;
                        this.productDefaultsDiscountPriceWrapper = new DiscountPriceWrapper(
                            this.line.requiredItemLocationQuantity.price,
                            new Quantity(1,this.line.requiredItemLocationQuantity.price.baseQuantity.unitCode),
                            this.line.priceOption,
                            [],
                            this.line.goodsItem.deliveryTerms.incoterms,
                            settings.negotiationSettings.paymentMeans[0],
                            this.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure);
                        this.productWrapper = new ProductWrapper(this.line, settings.negotiationSettings,this.productDefaultsDiscountPriceWrapper.quantity);
                        this.bpDataService.setCatalogueLines([this.line], [settings]);
                        this.getProductStatus.callback("Retrieved product details", true);
                        // we have to set bpStartEvent.workflowOptions here
                        // in BPDataService,chooseFirstValuesOfItemProperties method, we use this workflowOptions to select values of the properties correctly
                        this.bpDataService.bpStartEvent.workflowOptions = this.options;
                    })
                    .catch(error => {
                        this.getProductStatus.error("Failed to retrieve product details", error);

                        this.line = null;
                        this.productWrapper = null;
                    });
            }
        });

		// load favourite item ids for the person
        let userId = this.cookieService.get("user_id");
        this.callStatus.submit();
        this.userService.getPerson(userId)
        .then(person => {
            this.callStatus.callback("Successfully loaded user profile", true);
            this.favouriteItemIds = person.favouriteProductID;
        })
        .catch(error => {
            this.callStatus.error("Invalid credentials", error);
        });
    }

    /*
     * Event Handlers
     */

    onNegotiate(termsSource): void {
        this.navigateToBusinessProcess("Negotiation", termsSource);
    }

    onRequestInformation(): void {
        this.navigateToBusinessProcess("Item_Information_Request");
    }

    onStartPpap(): void {
        this.navigateToBusinessProcess("Ppap");
    }

    private navigateToBusinessProcess(targetProcess: ProcessType, termsSource: 'product_defaults' | 'frame_contract' = 'product_defaults'): void {
        this.bpDataService.startBp(new BpStartEvent('buyer',targetProcess,null,this.bpDataService.bpStartEvent.collaborationGroupId,null,this.options),false,
            new BpURLParams(this.catalogueId, this.id, null, termsSource));
    }

    onOrderQuantityChange(event:any): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    onTermsChange(event): void {
        if(event.target.value == 'product_defaults') {
            this.productDefaultsDiscountPriceWrapper.price = this.line.requiredItemLocationQuantity.price;
            this.productDefaultsDiscountPriceWrapper.incoterm = this.line.goodsItem.deliveryTerms.incoterms;
            this.productDefaultsDiscountPriceWrapper.paymentMeans = this.settings.negotiationSettings.paymentMeans[0];
            this.productDefaultsDiscountPriceWrapper.deliveryPeriod = this.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;

        } else {
            this.productDefaultsDiscountPriceWrapper.price = this.frameContractQuotationWrapper.quotationPriceWrapper.price;
            this.productDefaultsDiscountPriceWrapper.incoterm = this.frameContractQuotationWrapper.quotationIncoterms;
            this.productDefaultsDiscountPriceWrapper.paymentMeans = this.frameContractQuotationWrapper.quotationPaymentMeans;
            this.productDefaultsDiscountPriceWrapper.deliveryPeriod = this.frameContractQuotationWrapper.quotationFrameContractDuration;
        }
    }

    /*
     * Getters For Template
     */

    getPricePerItem(): string {
        this.updatePriceWrapperOnUserSelections();
        return this.productDefaultsDiscountPriceWrapper.pricePerItemString;
    }

    getTotalPrice(): number {
        this.updatePriceWrapperOnUserSelections();
        return this.productDefaultsDiscountPriceWrapper.totalPrice;
    }

    hasPrice(): boolean {
        return this.productDefaultsDiscountPriceWrapper.hasPrice();
    }

    getMaximumQuantity(): number {
        return getMaximumQuantityForPrice(this.productDefaultsDiscountPriceWrapper.price);
    }

    getSteps(): number {
        return getStepForPrice(this.productDefaultsDiscountPriceWrapper.price);
    }

    getQuantityUnit(): string {
        if(!this.line) {
            return "";
        }
        return this.line.requiredItemLocationQuantity.price.baseQuantity.unitCode || "";
    }

    isPpapAvailable(): boolean {
        return this.settings && !!this.settings.tradeDetails.ppapCompatibilityLevel;
    }

    private updatePriceWrapperOnUserSelections() {
        // copy the selected specific item properties into the price wrapper so that the discounts can be calculated based on the selections
        let copyItem = JSON.parse(JSON.stringify(this.item));
        this.bpDataService.selectFirstValuesAmongAlternatives(copyItem);
        this.productDefaultsDiscountPriceWrapper.additionalItemProperties = copyItem.additionalItemProperty;

        // similarly, copy the requested quantity as well
        this.productDefaultsDiscountPriceWrapper.quantity.value = this.options.quantity;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.productDefaultsDiscountPriceWrapper.appliedDiscounts,this.productDefaultsDiscountPriceWrapper.price.priceAmount.currencyID);
    }

    removeFavorites(item: CatalogueLine) {
        if (!this.addFavoriteCategoryStatus.isLoading()) {
          let itemidList = [];
          itemidList.push(item.hjid.toString());
          this.addFavoriteCategoryStatus.submit();
          this.userService.putUserFavourite(itemidList, FAVOURITE_LINEITEM_PUT_OPTIONS[0].value).then(res => {
              const prefCats_tmp = [];
              var index = this.favouriteItemIds.indexOf(item.hjid.toString());
              if (index !== -1) {
                this.favouriteItemIds.splice(index, 1);
              }
             this.findPrefItem(item.hjid);
              this.addFavoriteCategoryStatus.callback("Category removed from favorites", true);
          })
          .catch(error => {
              this.addFavoriteCategoryStatus.error("Error while removing category from favorites", error);
          });
        }
    }

    addFavorites(item: CatalogueLine) {
        if (!this.addFavoriteCategoryStatus.isLoading()) {
          let itemidList = [];
          itemidList.push(item.hjid.toString());
          this.addFavoriteCategoryStatus.submit();
          this.userService.putUserFavourite(itemidList, FAVOURITE_LINEITEM_PUT_OPTIONS[0].value).then(res => {
              const prefCats_tmp = [];
              var index = this.favouriteItemIds.indexOf(item.hjid.toString());
              if (index == -1) {
                this.favouriteItemIds.push(item.hjid.toString());
              }
             this.findPrefItem(item.hjid);
              this.addFavoriteCategoryStatus.callback("Category removed from favorites", true);
          })
          .catch(error => {
              this.addFavoriteCategoryStatus.error("Error while removing category from favorites", error);
          });
        }
    }



    findPrefItem(itemId: any): boolean {
        let found = false;
        found = (this.favouriteItemIds.indexOf(itemId.toString()) !== -1) ? true : false;
        return found;
    }
}
