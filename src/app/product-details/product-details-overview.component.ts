import {Component, Input, OnInit} from '@angular/core';
import { ProductWrapper } from "../common/product-wrapper";
import { CommodityClassification } from "../catalogue/model/publish/commodity-classification";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import {getPropertyKey, getPropertyValuesAsStrings, selectName, selectPreferredName} from '../common/utils';
import {Item} from '../catalogue/model/publish/item';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {CategoryService} from '../catalogue/category/category.service';
import {Code} from '../catalogue/model/publish/code';
import {CallStatus} from '../common/call-status';

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
    classificationNames = [];
    
    constructor(public categoryService:CategoryService) {
        if(this.wrapper){
            this.manufacturerPartyName = UBLModelUtils.getPartyDisplayName(this.wrapper.item.manufacturerParty);
        }
    }

    ngOnInit(){
        // get codes of the commodity classifications
        let codes:Code[] = [];
        let classifications = this.getClassifications();
        for(let classification of classifications){
            codes.push(classification.itemClassificationCode);
        }
        // get names of the commodity classifications
        this.getClassificationNames(codes);
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

    getClassificationNames(codes:Code[]){
        this.getClassificationNamesStatus.submit();
        this.categoryService.getCachedCategories(codes).then(categories => {
            for(let category of categories){
                this.classificationNames.push(selectPreferredName(category));
            }
            this.getClassificationNamesStatus.callback(null);
        }).catch(error => {
            this.getClassificationNamesStatus.error("Failed to get classification names",error);
        })
    }
}