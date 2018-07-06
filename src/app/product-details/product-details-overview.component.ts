import { Component, Input } from "@angular/core";
import { ProductWrapper } from "../common/product-wrapper";
import { CommodityClassification } from "../catalogue/model/publish/commodity-classification";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import { getPropertyKey } from "../common/utils";

@Component({
    selector: 'product-details-overview',
    templateUrl: './product-details-overview.component.html',
    styleUrls: ['./product-details-overview.component.css']
})
export class ProductDetailsOverviewComponent {

    @Input() wrapper: ProductWrapper;
    @Input() options: BpWorkflowOptions;
    @Input() readonly: boolean;

    selectedImage: number = 0;

    
    constructor() {

    }

    getClassifications(): CommodityClassification[] {
        if(!this.wrapper) {
            return [];
        }

        return this.wrapper.item.commodityClassification
            .filter(c => c.itemClassificationCode.listID != 'Default')
            .sort((c1, c2) => c1.itemClassificationCode.name.localeCompare(c2.itemClassificationCode.name));
    }

    onTogglePropertyValue(property: ItemProperty, valueIndex: number): void {
        if(this.options) {
            this.options.selectedValues[getPropertyKey(property)] = valueIndex;
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
        const selected = this.options.selectedValues[getPropertyKey(property)] || 0;
        return valueIndex === selected;
    }
}