import {Component, Input, OnInit} from '@angular/core';
import { ProductWrapper } from "../common/product-wrapper";
import { CommodityClassification } from "../catalogue/model/publish/commodity-classification";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import {getPropertyKey, getPropertyValuesAsStrings, selectName, selectNameFromLabelObject, selectPreferredValue} from '../common/utils';
import {Item} from '../catalogue/model/publish/item';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {CategoryService} from '../catalogue/category/category.service';
import { CatalogueService } from "../catalogue/catalogue.service";
import {CallStatus} from '../common/call-status';
import { ActivatedRoute,Router } from "@angular/router";

@Component({
    selector: 'product-details-overview',
    templateUrl: './product-details-overview.component.html',
    styleUrls: ['./product-details-overview.component.css']
})
export class ProductDetailsOverviewComponent implements OnInit{

    @Input() wrapper: ProductWrapper;
    @Input() options: BpWorkflowOptions;
    @Input() readonly: boolean;

    selectedImage: number = 0;
    manufacturerPartyName:string = null;

    getClassificationNamesStatus: CallStatus = new CallStatus();
    productCatalogueNameRetrievalStatus: CallStatus = new CallStatus();

    classificationNames = [];
    productId = "";
    selectPreferredValue = selectPreferredValue;
    facetQuery: any;
    catalogueId = "";
    catalogueName = "";
    
    constructor(
        public categoryService:CategoryService,
        public catalogueService:CatalogueService,
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

                this.getClassificationNamesStatus.callback(null);

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

    onTogglePropertyValue(property: ItemProperty, valueIndex: number): void {
        if(this.options) {
            this.options.selectedValues[getPropertyKey(property)] = valueIndex;
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
        if(!this.options) {
            return false;
        }
        let selected = null;

        // if there is no selected index for the given property, we should set it to 0.
        // it is important since we will calculate price options according to the selected properties

        if(this.options.selectedValues[getPropertyKey(property)]){
            selected = this.options.selectedValues[getPropertyKey(property)];
            // here, we do not need to update options.selectedValues since onTogglePropertyValue function will handle this.
        } else {
            selected = 0;
            this.options.selectedValues[getPropertyKey(property)] = 0
        }
        return valueIndex === selected;
    }

    getValuesAsString(property: ItemProperty): string[] {
        return getPropertyValuesAsStrings(property);
    }

    navigateToTheSearchPage(company : string){
        this.facetQuery = [];
		var fq = "manufacturer.legalName:\""+company+"\"";
		if (this.facetQuery.indexOf(fq) == -1)
			this.facetQuery.push(fq);
		else
			this.facetQuery.splice(this.facetQuery.indexOf(fq), 1);
		this.get("*");
    }

    get(search: String): void {
		this.router.navigate(['/simple-search'], {
			queryParams: {
				q: search,
				fq: encodeURIComponent(this.facetQuery.join('_SEP_')),
                p: 1,
                searchContext: null,	
                cat: "",
				catID: ""		
            }
		});
	}
}