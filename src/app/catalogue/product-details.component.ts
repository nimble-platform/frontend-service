import {Component, Input, OnInit} from "@angular/core";
import { CatalogueLine } from "./model/publish/catalogue-line";
import {ItemProperty} from "./model/publish/item-property";
import {Property} from "./model/category/property";
import {Code} from "./model/publish/code";
import {Quantity} from "./model/publish/quantity";
import {Dimension} from "./model/publish/dimension";
import {BPDataService} from "../bpe/bp-data-service";
import {UBLModelUtils} from "./model/ubl-model-utils";
import {PropertyBlockPipe} from "./property-block-pipe";
import {PublishService} from "./publish-and-aip.service";

@Component({
    selector: 'product-details',
    providers: [PropertyBlockPipe],
    templateUrl: './product-details.component.html',
})

// Component that displays category and custom properties inside the "product details" tab in CatalogueLin

export class ProductDetailsComponent implements OnInit{

    PROPERTY_BLOCK_FIELD_NAME: string = "name";
    PROPERTY_BLOCK_FIELD_ISCOLLAPSED = "isCollapsed";
    PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";

    @Input() presentationMode: string
    @Input() catalogueLine: CatalogueLine;

    /*
     * hash storing the blocks of each category
     * For eClasses, base block is held at propertyBlocks[itemClassificationCode.value][0]
     * and specific block at propertyBlocks[itemClassificationCode.value][1]
     * For others, the block is held at propertyBlocks[itemClassificationCode.listID][0]
     */
    // TODO why has but not a list at the beginning. the hash is being transformed to a list anyway...
    propertyBlocks: any = {};
    object = Object;
    dimensions: any = null;

    // keeping the collapsed state of property blocks. it is actually a reference to the actual kept in publish service
    propertyBlockCollapsedStates: Map<string, boolean> = new Map<string, boolean>();


    constructor(private bpDataService:BPDataService,
                private publishService: PublishService) {
        this.propertyBlockCollapsedStates = this.publishService.getCollapsedStates();
    }

    ngOnInit(): void {
        //this.refreshPropertyBlocks();
        this.createDimensionBlocks();
    }

    // this process might be realized in a pipe
    createDimensionBlocks():void {
        this.dimensions = {};
        for(let dim of this.catalogueLine.goodsItem.item.dimension) {
            if(this.dimensions[dim.attributeID] != null) {
                this.dimensions[dim.attributeID].push(dim.measure);
            } else {
                this.dimensions[dim.attributeID] = [dim.measure];
            }
        }
    }

    updateNegotiationItemDimensionData(attributeId, event:any) {
        this.bpDataService.updateDimension(attributeId, event.target.value);
    }

    createDimensionAttribute(attributeId:string, unitCode:string):void {
        let dimension:Dimension = UBLModelUtils.createDimension(attributeId, unitCode);
        this.catalogueLine.goodsItem.item.dimension.push(dimension);
        this.createDimensionBlocks();
    }

    deleteDimensionAttribute(attributeId:string, value:number):void {
        let dimension:Dimension[] = this.catalogueLine.goodsItem.item.dimension;
        let index:number = dimension.findIndex(dim => dim.attributeID == attributeId && dim.measure.value == value);
        dimension.splice(index, 1);
        this.createDimensionBlocks();
    }

    toggleCollapsed(blockName:string):void {
        this.propertyBlockCollapsedStates.set(blockName, !this.propertyBlockCollapsedStates.get(blockName));
    }

    trackByIndex(index: any, item: any) {
        return index;
    }
}
