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

    refreshPropertyBlocks(): void {
        this.propertyBlocks = {};

        // put all properties into their blocks
        for (let property of this.catalogueLine.goodsItem.item.additionalItemProperty) {

            if (property.itemClassificationCode.listID === "eClass") {
                if (this.propertyBlocks[property.itemClassificationCode.value] === undefined) {
                    this.createEClassPropertyBlocks(property.itemClassificationCode);
                }

                if (ProductDetailsComponent.isBaseEClassProperty(property.id)) {
                    this.propertyBlocks[property.itemClassificationCode.value][0]
                        [this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);

                } else {
                    this.propertyBlocks[property.itemClassificationCode.value][1]
                        [this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);
                }

            } else {
                if (this.propertyBlocks[property.itemClassificationCode.listID] === undefined) {
                    this.createPropertyBlock(property.itemClassificationCode);
                }

                this.propertyBlocks[property.itemClassificationCode.listID][0][this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);
            }
        }

        // strip the hash into an array of its values
        let propertyBlocksValues = this.propertyBlocks = (<any>Object).values(this.propertyBlocks);

        // empty property blocks
        this.propertyBlocks = [];

        // flatten the array of arrays and put it into propertyBlocks
        for (let block of propertyBlocksValues) {
            this.propertyBlocks = this.propertyBlocks.concat(block);
        }
    }

    private createEClassPropertyBlocks(code: Code) {
        let basePropertyBlock: any = {};
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = code.name + " (" + code.listID + " - Base)";
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];

        let specificPropertyBlock: any = {};
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = code.name + " (" + code.listID + " - Specific)";
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];

        let eClassGroup = [basePropertyBlock, specificPropertyBlock];
        this.propertyBlocks[code.value] = eClassGroup;
    }

    private createPropertyBlock(itemClassificationCode: Code) {
        let propertyBlock: any = {};
        propertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = itemClassificationCode.name != null ? itemClassificationCode.name : "" + " (" + itemClassificationCode.listID + ")";
        propertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        propertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];

        this.propertyBlocks[itemClassificationCode.listID] = [];
        this.propertyBlocks[itemClassificationCode.listID].push(propertyBlock);
    }

    private static isBaseEClassProperty(id: string): boolean {
        let pid: string = id;
        if (pid == "0173-1#02-AAD931#005" ||
            pid == "0173-1#02-AAO663#003" ||
            pid == "0173-1#02-BAB392#012" ||
            pid == "0173-1#02-AAO677#002" ||
            pid == "0173-1#02-AAO676#003" ||
            pid == "0173-1#02-AAO736#004" ||
            pid == "0173-1#02-AAO735#003" ||
            pid == "0173-1#02-AAP794#001" ||
            pid == "0173-1#02-AAQ326#002" ||
            pid == "0173-1#02-BAE391#004" ||
            pid == "0173-1#02-AAP796#004" ||
            pid == "0173-1#02-BAF831#002" ||
            pid == "0173-1#02-AAM551#002" ||
            pid == "0173-1#02-AAU734#001" ||
            pid == "0173-1#02-AAU733#001" ||
            pid == "0173-1#02-AAU732#001" ||
            pid == "0173-1#02-AAU731#001" ||
            pid == "0173-1#02-AAU730#001" ||
            pid == "0173-1#02-AAU729#001" ||
            pid == "0173-1#02-AAU728#001" ||
            pid == "0173-1#02-AAO742#002" ||
            pid == "0173-1#02-AAW336#001" ||
            pid == "0173-1#02-AAW337#001" ||
            pid == "0173-1#02-AAW338#001" ||
            pid == "0173-1#02-AAO057#002") {
            return true;
        } else {
            return false;
        }
    }

    updateNegotiationItemDimensionData(attributeId, event:any) {
        this.bpDataService.updateDimension(attributeId, event.target.value);
    }

    createDimensionAttribute(attributeId:string, unitCode:string):void {
        console.log(event);
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
