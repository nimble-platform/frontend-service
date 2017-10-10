import {Component, Input, OnInit} from "@angular/core";
import {Dimension} from "../model/publish/dimension";
import {UBLModelUtils} from "../model/ubl-model-utils";
import {BPDataService} from "../../bpe/bp-data-service";
/**
 * Created by suat on 04-Oct-17.
 */
@Component({
    selector: 'dimension-view',
    templateUrl: './dimension-view.component.html'
})

export class DimensionViewComponent implements OnInit {
    @Input() presentationMode: string;
    @Input() itemDimensions: Dimension[];
    dimensions: any = {};
    object = Object;

    constructor(private bpDataService:BPDataService) {}

    ngOnInit(): void {
        this.createDimensionBlocks();
    }

    addDimension(attributeId:string, unitCode:string):void {
        let dimension:Dimension = UBLModelUtils.createDimension(attributeId, unitCode);
        this.itemDimensions.push(dimension);
        this.createDimensionBlocks();
    }
    removeDimension(attributeId:string, value:number):void {
        let dimension:Dimension[] = this.itemDimensions;
        let index:number = dimension.findIndex(dim => dim.attributeID == attributeId && dim.measure.value == value);
        dimension.splice(index, 1);
        this.createDimensionBlocks();
    }

    updateDimensionAttribute(attributeId:string, value:string):void {
        for(let dim of this.itemDimensions) {
            if(dim.attributeID == attributeId) {
                dim.attributeID = value;
            }
        }
        this.createDimensionBlocks();
    }

    selectDimension(attributeId, event:any) {
        this.bpDataService.updateDimension(attributeId, event.target.value);
    }

    // this process might be realized in a pipe
    createDimensionBlocks():void {
        this.dimensions = {};
        for(let dim of this.itemDimensions) {
            if(this.dimensions[dim.attributeID] != null) {
                this.dimensions[dim.attributeID].push(dim.measure);
            } else {
                this.dimensions[dim.attributeID] = [dim.measure];
            }
        }
    }
}
