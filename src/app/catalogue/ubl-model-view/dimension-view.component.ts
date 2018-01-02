import {Component, Input, OnInit} from "@angular/core";
import {Dimension} from "../model/publish/dimension";
import {UBLModelUtils} from "../model/ubl-model-utils";
import {BPDataService} from "../../bpe/bp-view/bp-data-service";
import {Quantity} from "../model/publish/quantity";
import {FormGroup} from "@angular/forms";
import {ChildForm} from "../child-form";
/**
 * Created by suat on 04-Oct-17.
 */
@Component({
    selector: 'dimension-view',
    templateUrl: './dimension-view.component.html'
})

export class DimensionViewComponent extends ChildForm implements OnInit {
    @Input() presentationMode: string;
    @Input() header: string;
    @Input() itemDimensions: Dimension[];
    dimensionForm: FormGroup = new FormGroup({});
    dimensions: Map<string, Quantity[]> = new Map<string, Quantity[]>();
    keys: string[];
    object = Object;

    constructor(private bpDataService: BPDataService) {
        super();
    }

    ngOnInit(): void {
        this.createDimensionBlocks();
        this.addToParentForm('dimensions', this.dimensionForm);
    }

    addValueToDimension(attributeId: string, unitCode: string): void {
        let dimension: Dimension = UBLModelUtils.createDimension(attributeId, unitCode);
        this.itemDimensions.push(dimension);
        this.createDimensionBlocks();
    }

    addNewDimension(attributeId: string, unitCode: string): void {
        // check existence of same dimension
        let index: number = this.itemDimensions.findIndex(dim => dim.attributeID == attributeId);
        if (index != -1) {
            return;
        }

        this.addValueToDimension(attributeId, unitCode);
    }

    removeDimension(attributeId: string, value: number): void {
        let dimension: Dimension[] = this.itemDimensions;
        let index: number = dimension.findIndex(dim => dim.attributeID == attributeId && dim.measure.value == value);
        dimension.splice(index, 1);
        this.createDimensionBlocks();
    }

    updateDimensionAttribute(attributeId: string, value: string): void {
        // check the new dimension name already exists
        let index: number = this.itemDimensions.findIndex(dim => dim.attributeID == value);
        if (index == -1) {
            for (let dim of this.itemDimensions) {
                if (dim.attributeID == attributeId) {
                    dim.attributeID = value;
                }
            }
            this.createDimensionBlocks();

            // in case the dimension name is updated to an existing dimension, the changes are not reflected to the
            // actual dimension list and the view is re-rendered
        } else {
            this.keys = [];
            setTimeout(() => {
                this.createDimensionBlocks();
            });
        }
    }

    selectDimension(attributeId, event: any) {
        this.bpDataService.updateDimension(attributeId, event.target.value);
    }

    // this process might be realized in a pipe
    createDimensionBlocks(): void {
        this.dimensions = new Map<string, Quantity[]>();
        //this.removeFromParentForm('dimensions');

        for (let dim of this.itemDimensions) {
            if (this.dimensions.has(dim.attributeID)) {
                this.dimensions.get(dim.attributeID).push(dim.measure);
            } else {
                this.dimensions.set(dim.attributeID, [dim.measure]);
            }
        }

        this.keys = Array.from(this.dimensions.keys());
    }
}
