import { Component, OnInit, Predicate } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CatalogueService } from "../catalogue/catalogue.service";
import { CallStatus } from "../common/call-status";
import { BPDataService } from "../bpe/bp-view/bp-data-service";
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import { GoodsItem } from "../catalogue/model/publish/goods-item";
import { Item } from "../catalogue/model/publish/item";
import { ProductDetailsTab } from "./model/product-details-tab";
import { CommodityClassification } from "../catalogue/model/publish/commodity-classification";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { WorkflowOptions } from "./model/workflow-options";

@Component({
    selector: 'product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {

    getProductStatus:CallStatus = new CallStatus();

    id: string;
    catalogueId: string;

    options: WorkflowOptions = new WorkflowOptions();

    line?: CatalogueLine;
    goodsItem?: GoodsItem;
    item?: Item;

    selectedTab: ProductDetailsTab = "DETAILS";
    selectedImage: number = 0;

    // max price value for the quantity to be sold
    maxValue: number = 100000;

    constructor(
        private bpDataService: BPDataService,
        private catalogueService: CatalogueService,
        private route: ActivatedRoute
    ) {
        // this.line.goodsItem.containingPackage.packagingTypeCode.name
    }

    ngOnInit() {
        this.bpDataService.setCatalogueLines([]);
        this.getProductStatus.submit();
		this.route.queryParams.subscribe(params => {
			let id = params['id'];
            let catalogueId = params['catalogueId'];
            
            if(id !== this.id || catalogueId !== this.catalogueId) {
                this.id = id;
                this.catalogueId = catalogueId;

                this.catalogueService.getCatalogueLine(catalogueId, id).then(line => {
                    this.line = line;
                    this.goodsItem = line.goodsItem;
                    this.item = this.goodsItem.item;
                    this.bpDataService.resetBpData();
                    this.bpDataService.setCatalogueLines([line]);
                    this.bpDataService.userRole = 'buyer';
                    this.bpDataService.setRelatedGroupId(null);
                    this.getProductStatus.callback("Retrieved product details", true);
                }).catch(error => {
                    this.getProductStatus.error("Failed to retrieve product details");
                    console.log("Error while retrieving product", error);

                    this.line = null;
                    this.goodsItem = null;
                    this.item = null;
                });
            }
		});
    }

    /*
     * Event Handlers
     */

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
        // TODO fetch
    }

    onSelectImage(index: number): void {
        this.selectedImage = index;
        if(!this.item) {
            return;
        }
        if(this.selectedImage < 0) {
            this.selectedImage = this.item.productImage.length - 1;
        }
        // also works if productImage.length === 0
        if(this.selectedImage >= this.item.productImage.length) {
            this.selectedImage = 0;
        }
    }

    onTogglePropertyValue(property: ItemProperty, valueIndex: number): void {
        this.options.selectedValues[this.getKey(property)] = valueIndex;
    }

    onFastTrackOrdering(): void {
        console.log("FastTrackOrdering clicked!");
    }

    onNegotiate(): void {
        console.log("Negotiate clicked!");
    }

    onRequestInformation(): void {
        console.log("RequestInformation clicked!");
    }

    onNegotiateOtherTerms(): void {
        console.log("NegotiateOtherTerms clicked!");
    }

    onStartPpap(): void {
        console.log("StartPpap clicked!");
    }

    onPreviewTermsAndConditions(): void {
        console.log("PreviewTermsAndConditions clicked!");
    }

    /*
     * Getters For Template
     */

    getClassifications(): CommodityClassification[] {
        if(!this.item) {
            return [];
        }

        return this.item.commodityClassification
            .filter(c => c.itemClassificationCode.listID != 'Default')
            .sort((c1, c2) => c1.itemClassificationCode.name.localeCompare(c2.itemClassificationCode.name));
    }
    
    getUniqueProperties(): ItemProperty[] {
        return this.getUniquePropertiesWithFilter(prop => prop.value.join() !== "");
    }

    getPropertiesWithListOfValues(): ItemProperty[] {
        return this.getUniquePropertiesWithFilter(prop => prop.value.length > 1);
    }

    isPropertyValueSelected(property: ItemProperty, valueIndex: number): boolean {
        const selected = this.options.selectedValues[this.getKey(property)] || 0;
        return valueIndex === selected;
    }

    getTotalPrice(): number {
        if(!this.item) {
            return 0;
        }
        const price = this.line.requiredItemLocationQuantity.price;
        const amount = Number(price.priceAmount.value);
        return this.options.quantity * amount / price.baseQuantity.value;
    }

    /*
     * Internal methods
     */

    private getUniquePropertiesWithFilter(filter: Predicate<ItemProperty>): ItemProperty[] {
        if(!this.item) {
            return [];
        }

        const duplicates: any = {};
        const result = [];
        this.item.additionalItemProperty.forEach(prop => {
            if(!filter(prop)) {
                return;
            }

            const key = this.getKey(prop);
            if(!duplicates[key]) {
                result.push(prop);
            }

            duplicates[key] = true;
        })

        return result.sort((p1, p2) => p1.name.localeCompare(p2.name));
    }

    private getKey(property: ItemProperty): string {
         return property.name + "___" + property.valueQualifier;
    }

    private getMagnitude(value: number): number {
        return Math.pow(10, Math.floor(Math.log10(value)));
    }

    private round5(value: number): number {
        return Math.round(value / 5) * 5;
    }

    // rounds the first digit of a number to the nearest 5 or 10
    private roundFirstDigit(value: number): number {
        let roundedDigit = this.round5(value / this.getMagnitude(value));
        if(roundedDigit == 0) {
            roundedDigit = 1;
        }
        return roundedDigit;
    }

    private getMaximumQuantity(value: number): number {
        let result = this.maxValue / value;
        return this.roundFirstDigit(result) * this.getMagnitude(result);
    }

    private getSteps(value: number): number {
        return this.getMaximumQuantity(value) / 100;
    }
}