import {Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { CatalogueService } from "../catalogue/catalogue.service";
import { CallStatus } from "../common/call-status";
import { BPDataService } from "../bpe/bp-view/bp-data-service";
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import { ProcessType } from "../bpe/model/process-type";
import { ProductWrapper } from "../common/product-wrapper";
import {TranslateService} from '@ngx-translate/core';
import { Item } from "../catalogue/model/publish/item";
import {
    copy,
    getMaximumQuantityForPrice,
    getStepForPrice,
    isTransportService,
    selectPreferredValue,
    isLogisticsService, validateNumberInput
} from '../common/utils';
import { AppComponent } from "../app.component";
import { UserService } from "../user-mgmt/user.service";
import { CompanySettings } from "../user-mgmt/model/company-settings";
import {Quantity} from '../catalogue/model/publish/quantity';
import {DiscountModalComponent} from './discount-modal.component';
import {BpActivityEvent} from '../catalogue/model/publish/bp-start-event';
import { CookieService } from 'ng2-cookies';
import {FAVOURITE_LINEITEM_PUT_OPTIONS} from '../catalogue/model/constants';
import * as myGlobals from '../globals';
import {DiscountPriceWrapper} from "../common/discount-price-wrapper";
import {DigitalAgreement} from "../catalogue/model/publish/digital-agreement";
import {DocumentService} from "../bpe/bp-view/document-service";
import {BPEService} from "../bpe/bpe.service";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {QuotationWrapper} from "../bpe/bp-view/negotiation/quotation-wrapper";

@Component({
    selector: 'product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
    // the first two call status are just to control the enabled/disabled status of quantity input
    // we need initCheckgetProductStatus since getProductStatus is updated by the view based on user actions
    initCheckGetFrameContractStatus: CallStatus = new CallStatus();
    initCheckGetProductStatus: CallStatus = new CallStatus();
    getProductStatus: CallStatus = new CallStatus();
    associatedProductsRetrievalCallStatus: CallStatus = new CallStatus();

    id: string;
    catalogueId: string;
    favouriteItemIds: string[] = [];

    // options: BpWorkflowOptions = new BpWorkflowOptions();
    itemWithSelectedProperties: Item = new Item();
    orderQuantity = 1;

    line?: CatalogueLine;
    item?: Item;
    productWrapper?: ProductWrapper;
    associatedProducts: CatalogueLine[] = [];
    settings?: CompanySettings;
    priceWrapper?: DiscountPriceWrapper;
    frameContractQuotationWrapper: QuotationWrapper;
    frameContract: DigitalAgreement;
    tabToOpen: string = "";
    isLogistics: boolean = false;
    isTransportService:boolean = false;

    termsSelectBoxValue: 'product_defaults' | 'frame_contract' = 'product_defaults';

    // business workflow of seller company
    companyWorkflowMap = null;

    addFavoriteCategoryStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;

    config = myGlobals.config;
    selectPreferredValue = selectPreferredValue;
    onOrderQuantityKeyPressed = validateNumberInput;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private catalogueService: CatalogueService,
                private documentService: DocumentService,
                private userService: UserService,
                private route: ActivatedRoute,
                private cookieService: CookieService,
                private translate: TranslateService,
                public appComponent: AppComponent) {

    }

    ngOnInit() {
		this.route.queryParams.subscribe(params => {
			let id = params['id'];
            let catalogueId = params['catalogueId'];
            this.tabToOpen = params['tabToOpen'];
            let orderQuantity: string = params['orderQuantity'];
            if (orderQuantity) {
                this.orderQuantity = Number.parseInt(orderQuantity);
            }

            if(id !== this.id || catalogueId !== this.catalogueId) {
                this.id = id;
                this.catalogueId = catalogueId;

                this.getProductStatus.submit();
                this.initCheckGetFrameContractStatus.submit();
                this.initCheckGetProductStatus.submit();
                this.catalogueService.getCatalogueLine(catalogueId, id)
                    .then(line => {
                        this.line = line;
                        this.item = line.goodsItem.item;
                        this.itemWithSelectedProperties = copy(this.item);
                        this.isLogistics = isLogisticsService(this.line);
                        this.isTransportService = isTransportService(this.line);

                        // check frame contract for the current line
                        this.bpeService.getFrameContract(UBLModelUtils.getPartyId(this.line.goodsItem.item.manufacturerParty),
                            this.cookieService.get("company_id"),
                            [this.line.id]).then(contracts => {
                            // contract exists, get the corresponding quotation including the terms
                            this.documentService.getDocumentJsonContent(contracts[0].quotationReference.id).then(document => {
                                this.frameContract = contracts[0];
                                this.frameContractQuotationWrapper = new QuotationWrapper(document, this.line, UBLModelUtils.getFrameContractQuotationLineIndexForProduct(document.quotationLine,catalogueId,id));
                                // quotation ordered quantity contains the actual ordered quantity in that business process,
                                // so we overwrite it with the options's quantity, which is by default 1
                                this.frameContractQuotationWrapper.orderedQuantity.value = this.orderQuantity;

                                this.initCheckGetFrameContractStatus.callback(null, true);
                            }).catch(error => {
                                this.initCheckGetFrameContractStatus.callback(null, true);
                            });
                        }).catch(error => {
                            this.initCheckGetFrameContractStatus.callback(null, true);
                        });

                        return Promise.all([this.userService.getSettingsForProduct(line), this.retrieveAssociatedProductDetails()]);
                    })
                    .then(([settings, associatedProducts]) => {
                        this.bpDataService.selectFirstValuesAmongAlternatives(this.itemWithSelectedProperties, associatedProducts);
                        this.settings = settings;
                        this.associatedProducts = associatedProducts;
                        this.priceWrapper = new DiscountPriceWrapper(
                            this.line.requiredItemLocationQuantity.price,
                            copy(this.line.requiredItemLocationQuantity.price),
                            this.line.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
                            new Quantity(1,this.line.requiredItemLocationQuantity.price.baseQuantity.unitCode),
                            this.line.priceOption,
                            [],
                            this.line.goodsItem.deliveryTerms.incoterms,
                            settings.negotiationSettings.paymentMeans[0],
                            this.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure);
                        this.productWrapper = new ProductWrapper(this.line, settings.negotiationSettings,this.priceWrapper.orderedQuantity);

                        // get the business workflow of seller company
                        this.companyWorkflowMap = this.bpDataService.getCompanyWorkflowMap(settings.negotiationSettings.company.processID);

                        // the quantity change event handler is called here to update the price in case a specific quantity is provided as a query parameter
                        this.onOrderQuantityChange(this.orderQuantity);

                        this.getProductStatus.callback("Retrieved product details", true);
                        this.initCheckGetProductStatus.error(null);
                    })
                    .catch(error => {
                        this.line = null;
                        this.productWrapper = null;

                        this.getProductStatus.error("Failed to retrieve product details", error);
                        this.initCheckGetProductStatus.error(null);
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
        this.bpDataService.startBp(
            new BpActivityEvent(
                'buyer',
                targetProcess,
                null,
                null,
                [],
                [this.itemWithSelectedProperties],
                new Quantity(this.orderQuantity, this.getQuantityUnit()),
                true, // this is a new process
                [this.catalogueId], [this.id], null, null, [termsSource]),
            false);
    }

    onOrderQuantityChange(value: number): void {
        this.orderQuantity = value;
        this.priceWrapper.orderedQuantity.value = this.orderQuantity;
        if(this.frameContractQuotationWrapper != null) {
            this.frameContractQuotationWrapper.orderedQuantity.value = this.orderQuantity;
        }

        // quantity change must be activated in the next iteration of execution
        // otherwise, the update discount method will use the old value of the quantity
        setTimeout((() => {
            this.onTermsChange(this.termsSelectBoxValue);
        }), 0);
    }

    onTermsChange(event): void {
        this.termsSelectBoxValue = event;
        this.priceWrapper.additionalItemProperties = this.itemWithSelectedProperties.additionalItemProperty;

        if(event == 'product_defaults') {
            this.priceWrapper.itemPrice.value = this.priceWrapper.discountedPricePerItem;
        }
    }

    /*
     * Getters For Template
     */

    getPricePerItem(): string {
        return this.priceWrapper.discountedPricePerItemString;
    }

    hasPrice(): boolean {
        return this.priceWrapper.itemPrice.hasPrice();
    }

    getMaximumQuantity(): number {
        return getMaximumQuantityForPrice(this.priceWrapper.price);
    }

    getSteps(): number {
        return getStepForPrice(this.priceWrapper.price);
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

    private openDiscountModal(): void{
        this.discountModal.open(this.priceWrapper);
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

    setTab(data) {
      if (data) {
    	this.tabToOpen = "COMPANY";
      }
      else {
    	this.tabToOpen = null;
      }
    }

    /**
     * Retrieves products associated via the item properties of this product
     */
    retrieveAssociatedProductDetails(): Promise<CatalogueLine[]> {
        // We retrieve the associated product details if editing is active.
        let associatedProductIds: number[] = [];

        // aggregate identifiers of all associated products
        for (let itemProperty of this.line.goodsItem.item.additionalItemProperty) {
            if (itemProperty.associatedCatalogueLineID.length > 0) {
                associatedProductIds = associatedProductIds.concat(itemProperty.associatedCatalogueLineID);
            }
        }

        // retrieve the associated products
        return this.catalogueService.getCatalogueLinesByHjids(associatedProductIds);
    }
}
