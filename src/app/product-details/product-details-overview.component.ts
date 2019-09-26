import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import { ProductWrapper } from "../common/product-wrapper";
import { CommodityClassification } from "../catalogue/model/publish/commodity-classification";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import {getPropertyKey, getPropertyValues, getPropertyValuesAsStrings, selectName, selectNameFromLabelObject, selectPreferredValue} from '../common/utils';
import {Item} from '../catalogue/model/publish/item';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {CategoryService} from '../catalogue/category/category.service';
import { CatalogueService } from "../catalogue/catalogue.service";
import {CallStatus} from '../common/call-status';
import { ActivatedRoute,Router } from "@angular/router";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'product-details-overview',
    templateUrl: './product-details-overview.component.html',
    styleUrls: ['./product-details-overview.component.css']
})
export class ProductDetailsOverviewComponent implements OnInit{

    @Input() wrapper: ProductWrapper;
    @Input() itemWithSelectedProps: Item;
    @Input() readonly: boolean;
    @Output() compStatus = new EventEmitter<boolean>();
    @Output() onPropertyValueChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    selectedImage: number = 0;
    manufacturerPartyName:string = null;

    getClassificationNamesStatus: CallStatus = new CallStatus();
    productCatalogueNameRetrievalStatus: CallStatus = new CallStatus();

    classificationNames = [];
    productId = "";
    selectPreferredValue = selectPreferredValue;
    catalogueId = "";
    catalogueName = "";

    zoomedImgURL = "";

    constructor(
        private translate: TranslateService,
        public categoryService:CategoryService,
        public catalogueService:CatalogueService,
        private modalService: NgbModal,
        private route: ActivatedRoute,
		public router: Router

    ) {}

    ngOnInit(){
        if(this.wrapper){
            this.manufacturerPartyName = UBLModelUtils.getPartyDisplayName(this.wrapper.item.manufacturerParty);
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
            this.categoryService.getCategories(categoryUris).then(response => {
                for(let category of response.result) {
                    this.classificationNames.push(selectNameFromLabelObject(category.label));
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
        });
    }

    getClassifications(): CommodityClassification[] {
        if(!this.wrapper) {
            return [];
        }

        return this.wrapper.item.commodityClassification
            .filter(c => c.itemClassificationCode.listID != 'Default');
    }

    onTogglePropertyValue(property: ItemProperty, selectedIndex: number): void {
        if (this.itemWithSelectedProps != null) {
            let selectedValue = getPropertyValues(property)[selectedIndex];
            let propKey = getPropertyKey(property);
            for (let aip of this.itemWithSelectedProps.additionalItemProperty) {
                if (propKey === getPropertyKey(aip)) {
                    if (aip.valueQualifier === 'STRING') {
                        aip.value[0] = selectedValue;
                    } else if (aip.valueQualifier === 'NUMBER') {
                        aip.valueDecimal[0] = selectedValue;
                    } else if (aip.valueQualifier === 'QUANTITY') {
                        aip.valueQuantity[0] = selectedValue;
                    }
                    this.onPropertyValueChange.emit(true);
                    return;
                }
            }
        }
    }

    selectName (ip: ItemProperty | Item) {
        return selectName(ip);
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

}
