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
    roundToTwoDecimals, isLogisticsService
} from '../common/utils';
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
    wrapper?: ProductWrapper;
    settings?: CompanySettings;
    priceWrapper?: PriceWrapper;
    tabToOpen: string = "";
    toggleImageBorder: boolean = false;
    showNavigation: boolean = true;
    showProcesses: boolean = true;
    isLogistics: boolean = false;
    isTransportService:boolean = false;

    config = myGlobals.config;

    addFavoriteCategoryStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();
    FAVOURITE_LINEITEM_PUT_OPTIONS = FAVOURITE_LINEITEM_PUT_OPTIONS;

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;
    selectPreferredValue = selectPreferredValue;

    constructor(private bpDataService: BPDataService,
                private catalogueService: CatalogueService,
                private searchContextService: SearchContextService,
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
                        this.isLogistics = isLogisticsService(this.line);
                        this.isTransportService = isTransportService(this.line);
                        return this.userService.getSettingsForProduct(line)
                    })
                    .then(settings => {
                        this.settings = settings;
                        this.priceWrapper = new PriceWrapper(
                            this.line.requiredItemLocationQuantity.price,
                            new Quantity(1,this.line.requiredItemLocationQuantity.price.baseQuantity.unitCode),
                            this.line.priceOption,
                            [],
                            this.line.goodsItem.deliveryTerms.incoterms,
                            settings.negotiationSettings.paymentMeans[0],
                            this.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure);
                        this.wrapper = new ProductWrapper(this.line, settings.negotiationSettings,this.priceWrapper.quantity);
                        this.bpDataService.setCatalogueLines([this.line], [settings]);
                        this.getProductStatus.callback("Retrieved product details", true);
                        // we have to set bpStartEvent.workflowOptions here
                        // in BPDataService,chooseFirstValuesOfItemProperties method, we use this workflowOptions to select values of the properties correctly
                        this.bpDataService.bpStartEvent.workflowOptions = this.options;
                    })
                    .catch(error => {
                        this.getProductStatus.error("Failed to retrieve product details", error);

                        this.line = null;
                        this.wrapper = null;
                    });
            }
        });
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

    onNegotiate(): void {
        this.navigateToBusinessProcess("Negotiation");
    }

    onRequestInformation(): void {
        this.navigateToBusinessProcess("Item_Information_Request");
    }

    onStartPpap(): void {
        this.navigateToBusinessProcess("Ppap");
    }

    private navigateToBusinessProcess(targetProcess: ProcessType): void {
        this.bpDataService.startBp(new BpStartEvent('buyer',targetProcess,null,this.bpDataService.bpStartEvent.collaborationGroupId,null,this.options),false,
            new BpURLParams(this.catalogueId,this.id,null));
    }

    /*
     * Getters For Template
     */

    getPricePerItem(): string {
        this.updatePriceWrapperOnUserSelections();
        return this.priceWrapper.pricePerItemString;
    }

    getTotalPrice(): number {
        this.updatePriceWrapperOnUserSelections();
        return this.priceWrapper.totalPrice;
    }

    hasPrice(): boolean {
        return this.priceWrapper.hasPrice();
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

    onOrderQuantityChange(event:any): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    isPpapAvailable(): boolean {
        return this.settings && !!this.settings.tradeDetails.ppapCompatibilityLevel;
    }

    private updatePriceWrapperOnUserSelections() {
        let copyItem = JSON.parse(JSON.stringify(this.item));
        this.bpDataService.selectFirstValuesAmongAlternatives(copyItem);
        this.priceWrapper.additionalItemProperties = copyItem.additionalItemProperty;
        this.priceWrapper.quantity.value = this.options.quantity;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.priceWrapper.appliedDiscounts,this.priceWrapper.price.priceAmount.currencyID);
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
