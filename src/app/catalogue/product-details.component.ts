import {Component, Input, OnInit} from "@angular/core";
import { CatalogueLine } from "./model/publish/catalogue-line";
import {ItemProperty} from "./model/publish/item-property";

@Component({
    selector: 'product-details',
    templateUrl: './product-details.component.html',
})

// Component that displays category and custom properties inside the "product details" tab in CatalogueLin

export class ProductDetailsComponent implements OnInit{

    PROPERTY_BLOCK_FIELD_NAME: string = "name";
    PROPERTY_BLOCK_FIELD_ISCOLLAPSED = "isCollapsed";
    PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";

    @Input() catalogueLine: CatalogueLine;

    // list keeping the custom additional properties
    customProperties: ItemProperty[] = [];
    // hash storing the blocks of each category, indexed by itemClassificationCode.value
    propertyBlocks: any = {};
    // custom properties block, if there are any
    customPropertiesBlock: any = null;

    ngOnInit(): void {
        this.refreshPropertyBlocks();
    }

    refreshPropertyBlocks(): void {
        this.customProperties = [];
        this.propertyBlocks = {};

        // determine categories the item belongs to
        for (let classification of this.catalogueLine.goodsItem.item.commodityClassification) {
            let propertyBlock: any = {};
            propertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = classification.itemClassificationCode.name;
            propertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
            propertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];
            this.propertyBlocks[classification.itemClassificationCode.value] = propertyBlock;
        }

        // put all properties into their blocks
        for (let property of this.catalogueLine.goodsItem.item.additionalItemProperty) {
            if (property.itemClassificationCode.listID === "Custom") {
                this.customProperties.push(property);
            }
            else if (property.itemClassificationCode.listID === "eClass") {
                this.propertyBlocks[property.itemClassificationCode.value][this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);
            }
        }

        // Configure custom properties block if there are any custom properties
        if (this.customProperties.length > 0) {
            this.customPropertiesBlock = {};
            this.customPropertiesBlock[this.PROPERTY_BLOCK_FIELD_NAME] = "Custom Properties";
            this.customPropertiesBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
            this.customPropertiesBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = this.customProperties;
        }

        // Convert propertyBlocks to an array of its values so it's iterable to *ngFor
        this.propertyBlocks = (<any>Object).values(this.propertyBlocks);
    }
}
