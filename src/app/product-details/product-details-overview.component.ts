import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import { ProductWrapper } from "../common/product-wrapper";
import { CommodityClassification } from "../catalogue/model/publish/commodity-classification";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import {
    getPropertyKey,
    getPropertyValues,
    getPropertyValuesAsStrings,
    isLogisticsService,
    selectName,
    selectNameFromLabelObject,
    selectPreferredValue,
} from '../common/utils';
import {Item} from '../catalogue/model/publish/item';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {CategoryService} from '../catalogue/category/category.service';
import { CatalogueService } from "../catalogue/catalogue.service";
import {CallStatus} from '../common/call-status';
import { ActivatedRoute,Router } from "@angular/router";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {CatalogueLine} from "../catalogue/model/publish/catalogue-line";
import * as moment from "moment";
import { CookieService } from 'ng2-cookies';
import {CredentialsService} from '../user-mgmt/credentials.service';
import * as myGlobals from '../globals';
import {UserService} from '../user-mgmt/user.service';
import {ShoppingCartDataService} from '../bpe/shopping-cart/shopping-cart-data-service';
import {ValidationService} from '../common/validation/validators';
import {FormGroup} from '@angular/forms';

@Component({
    selector: 'product-details-overview',
    templateUrl: './product-details-overview.component.html',
    styleUrls: ['./product-details-overview.component.css']
})
export class ProductDetailsOverviewComponent implements OnInit{

    @Input() wrapper: ProductWrapper;
    @Input() itemWithSelectedProps: Item;
    @Input() associatedProducts: CatalogueLine[];
    @Input() readonly: boolean;
    @Input() showAddToCartButton: boolean;
    @Input() inShoppingBasket: boolean;
    @Input() isNegotiateOrderButtonDisabled:boolean = false;
    @Input() shoppingCartItemForm: FormGroup;
    // flag to adjust the name of the negotiate or order button,
    // true means the there are some negotiated terms and a negotiation process should be started. otherwise an order process is started
    @Input() isNegotiatingAnyTerm: boolean;
    @Output() onCartItemDeleted: EventEmitter<CatalogueLine> = new EventEmitter<CatalogueLine>();
    @Output() onNegotiate: EventEmitter<CatalogueLine> = new EventEmitter<CatalogueLine>();
    @Output() compStatus = new EventEmitter<boolean>();
    @Output() onPropertyValueChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    selectedImage: number = 0;
    manufacturerPartyName:string = null;

    getManufacturerPartyNameStatus: CallStatus = new CallStatus();
    getClassificationNamesStatus: CallStatus = new CallStatus();
    productCatalogueNameRetrievalStatus: CallStatus = new CallStatus();
    associatedProductsRetrievalCallStatus: CallStatus = new CallStatus();
    shoppingCartCallStatus: CallStatus = new CallStatus();

    classificationNames = [];
    productId = "";
    selectPreferredValue = selectPreferredValue;
    catalogueId = "";
    catalogueName = "";
    debug = myGlobals.debug;
    config = myGlobals.config;
    companyId = '';
    activeComp = '';

    zoomedImgURL = "";

    constructor(
        private translate: TranslateService,
        public categoryService:CategoryService,
        public catalogueService:CatalogueService,
        private shoppingCartDataService: ShoppingCartDataService,
        private validationService: ValidationService,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private cookieService: CookieService,
        private credentialsService: CredentialsService,
		public router: Router,
        public userService: UserService
    ) {}

    ngOnInit(){
		this.companyId = this.cookieService.get("company_id");
		this.activeComp = this.cookieService.get("active_company_name");

        if(this.wrapper){
            this.getManufacturerPartyNameStatus.submit();
            this.userService.getParty(this.wrapper.item.manufacturerParty.partyIdentification[0].id,this.wrapper.item.manufacturerParty.federationInstanceID).then(party => {
                this.manufacturerPartyName = UBLModelUtils.getPartyDisplayName(party);
                this.getManufacturerPartyNameStatus.callback(null,true);
            }).catch(error => {
                this.getManufacturerPartyNameStatus.error("Failed to get manufacturer party name", error);
            })

            // do not show Subscribe button for logistics services
            this.showAddToCartButton = this.showAddToCartButton && !isLogisticsService(this.wrapper.line);
        }
        /*
            Cache FurnitureOntology categories. Then, use cached categories to get correct category label according
            to the default language of the browser.
         */
        this.getClassificationNamesStatus.submit();
        let classifications = this.getClassifications();
        let categoryUris: string[] = [];
        if(classifications.length > 0) {
            for (let classification of this.wrapper.item.commodityClassification) {
                categoryUris.push(classification.itemClassificationCode.uri);
            }
            this.classificationNames = [];
            let manPartyId  =  UBLModelUtils.getPartyId(this.wrapper.goodsItem.item.manufacturerParty);
            let userId = this.cookieService.get('user_id');
            let log = {
                "@timestamp": moment().utc().toISOString(),
                "level": "INFO",
                "serviceID": "frontend-service",
                "userId": userId,
                "companyId": this.companyId,
                "active_company": this.activeComp,
                "manufactured_companyId" : manPartyId,
                "activity": "product_visit"
              };

              if (this.debug)
                console.log("Writing log "+JSON.stringify(log));
              this.credentialsService.logUrl(log)
                .then(res => {})
                .catch(error => {});

            this.categoryService.getCategories(categoryUris).then(response => {
                for(let category of response.result) {
                    this.classificationNames.push(selectNameFromLabelObject(category.label));
                    let LabelName = selectNameFromLabelObject(category.label);
                    if (this.config.loggingEnabled && this.companyId != manPartyId) {
                      let log = {
                        "@timestamp": moment().utc().toISOString(),
                        "level": "INFO",
                        "serviceID": "frontend-service",
                        "userId": userId,
                        "companyId": this.companyId,
                        "active_company": this.activeComp,
                        "manufactured_companyId" : manPartyId,
                        "category" : LabelName,
                        "activity": "category_visits"
                      };
        
                      if (this.debug)
                        console.log("Writing log "+JSON.stringify(log));
                      this.credentialsService.logUrl(log)
                        .then(res => {})
                        .catch(error => {});
                    }
                }

                // sort labels
                this.classificationNames.sort((c1, c2) => c1.localeCompare(c2));

                this.getClassificationNamesStatus.callback(null, true);

            }).catch(error => {
                this.getClassificationNamesStatus.error("Failed to get classification names", error);
            });
        }

        this.route.queryParams.subscribe(params => {
            if (params["id"]) {
              this.productId = params["id"];
            }else {
                this.productId = this.wrapper.item.manufacturersItemIdentification.id;
            }

            if(params["catalogueId"]){
                this.catalogueId = params["catalogueId"];
            }else{
                this.catalogueId = this.wrapper.item.catalogueDocumentReference.id;
            }

            this.productCatalogueNameRetrievalStatus.submit();

            this.catalogueService.getCatalogueFromUuid(this.catalogueId)
            .then((res) =>
            {
              this.catalogueName = res.id;
              this.productCatalogueNameRetrievalStatus.callback("Successfully loaded catalogue name", true);

            })
            .catch(err => {
                this.productCatalogueNameRetrievalStatus.error('Failed to get product catalogue');
            })
            // display a message if the product is included in the Subscriptions
            this.shoppingCartDataService.getShoppingCart().then(catalogue => {
                if(UBLModelUtils.isProductInCart(catalogue,this.catalogueId,this.productId)){
                    this.shoppingCartCallStatus.callback("Service is added to Subscriptions.", false);
                }
            })
        });
    }

    onAddToCart(): void {
        event.preventDefault();
        // check whether the item can be added to the cart
        let isProductAddable: boolean = this.shoppingCartDataService.isProductAddableToCart(
            this.wrapper.line.goodsItem.item.catalogueDocumentReference.id,
            this.wrapper.line.goodsItem.item.manufacturersItemIdentification.id);
        if (!isProductAddable) {
            return;
        }

        // do not add item to the cart if a process is still being added
        if (this.shoppingCartCallStatus.isLoading()) {
            return;
        }

        this.shoppingCartCallStatus.submit();
        this.shoppingCartDataService.addItemToCart(this.wrapper.line.hjid,this.wrapper.quantity.value,this.wrapper.item.manufacturerParty.federationInstanceID).then(() => {
            this.shoppingCartCallStatus.callback("Service is added to Subscriptions.", false);
        }).catch((err) => {
            this.shoppingCartCallStatus.error('Failed to add product to cart', err);
        });
    }

    onTogglePropertyValue(property: ItemProperty, selectedIndex: number): void {
        if (this.itemWithSelectedProps != null) {
            let selectedValue = getPropertyValues(property)[selectedIndex];
            let propKey = getPropertyKey(property);
            for (let aip of this.itemWithSelectedProps.additionalItemProperty) {
                if (propKey === getPropertyKey(aip)) {
                    // update the actual value
                    if (aip.valueQualifier === 'STRING') {
                        aip.value[0] = selectedValue;
                    } else if (aip.valueQualifier === 'NUMBER') {
                        aip.valueDecimal[0] = selectedValue;
                    } else if (aip.valueQualifier === 'QUANTITY') {
                        aip.valueQuantity[0] = selectedValue;
                    }

                    // update the associated item id
                    if (property.associatedCatalogueLineID != null && property.associatedCatalogueLineID.length > 0) {
                        // find the corresponding product id
                        let foundProduct = false;
                        for (let associatedProduct of this.associatedProducts) {
                            // checking the names of the associated product against the selected value
                            if (UBLModelUtils.doesTextArraysContainText(associatedProduct.goodsItem.item.name, selectedValue)) {
                                aip.associatedCatalogueLineID = [associatedProduct.hjid];
                                foundProduct = true;
                                break;
                            }
                        }
                        // Somehow, most probably because of an update in the associated product or values not linked to any product,
                        // the selected value cannot be existing product. Therefore, we clear the associated catalogue line id list
                        // to prevent wrong association.
                        if (!foundProduct) {
                            aip.associatedCatalogueLineID = [];
                        }
                    }

                    this.onPropertyValueChange.emit(true);
                    return;
                }
            }
        }
    }

    onSelectImage(index: number): void {
        this.selectedImage = index;
        if(!this.wrapper) {
            return;
        }
        if(this.selectedImage < 0) {
            this.selectedImage = this.wrapper.item.productImage.length - 1;
        }
        // also works if productImage.length === 0
        if(this.selectedImage >= this.wrapper.item.productImage.length) {
            this.selectedImage = 0;
        }
    }

    onRemoveFromCartButtonClicked(): void {
        this.onCartItemDeleted.emit(this.wrapper.line);
    }

    onNegotiateAndOrderButtonClicked(): void {
        this.onNegotiate.emit(this.wrapper.line);
    }

    selectName (ip: ItemProperty | Item) {
        return selectName(ip);
    }

    isAddCartDisabled(): boolean {
        if (this.shoppingCartCallStatus.fb_callback ||
            !this.shoppingCartDataService.isProductAddableToCart(
                this.wrapper.line.goodsItem.item.catalogueDocumentReference.id,
                this.wrapper.line.goodsItem.item.manufacturersItemIdentification.id)) {
            return true;
        }
        return false;
    }

    getClassifications(): CommodityClassification[] {
        if(!this.wrapper) {
            return [];
        }

        return this.wrapper.item.commodityClassification
            .filter(c => c.itemClassificationCode.listID != 'Default');
    }

    isPropertyValueSelected(property: ItemProperty, valueIndex: number): boolean {
        if (this.itemWithSelectedProps == null) {
            return false;
        }

        let selectedValue;
        let propKey = getPropertyKey(property);
        for (let aip of this.itemWithSelectedProps.additionalItemProperty) {
            if (propKey === getPropertyKey(aip)) {
                selectedValue = getPropertyValues(aip)[0];
                break;
            }
        }

        let checkedValue = getPropertyValues(property)[valueIndex];
        return UBLModelUtils.areItemPropertyValuesEqual(selectedValue, checkedValue, property.valueQualifier);
    }

    isDisabled(): boolean {
        return this.readonly || this.associatedProductsRetrievalCallStatus.isLoading();
    }

    getValuesAsString(property: ItemProperty): string[] {
        return getPropertyValuesAsStrings(property);
    }

    openCompTab(){
      this.compStatus.emit(true);
    }

    open(content) {
      this.zoomedImgURL = "data:"+this.wrapper.item.productImage[this.selectedImage].mimeCode+";base64,"+this.wrapper.item.productImage[this.selectedImage].value
    	this.modalService.open(content);
    }

    navigateImages(index: number, length: number): number {
        if(index < 0) {
            return length - 1;
        }
        else if(index < length) {
            return index;
        }
        // also works if productImage.length === 0
        else if(index >= length) {
            return 0;
        }
    }
}
