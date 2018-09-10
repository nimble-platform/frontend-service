import {Component, Input, OnInit} from "@angular/core";
import { CatalogueLine } from "../../model/publish/catalogue-line";
import {ItemProperty} from "../../model/publish/item-property";
import {Property} from "../../model/category/property";
import {Code} from "../../model/publish/code";
import {Quantity} from "../../model/publish/quantity";
import {Dimension} from "../../model/publish/dimension";
import {BPDataService} from "../../../bpe/bp-view/bp-data-service";
import {UBLModelUtils} from "../../model/ubl-model-utils";
import {PropertyBlockPipe} from "../../property-block-pipe";
import {PublishService} from "../../publish-and-aip.service";
import {TransportationService} from "../../model/publish/transportation-service";
import {FormGroup} from "@angular/forms";

@Component({
    selector: 'transportation-service-details',
    providers: [PropertyBlockPipe],
    templateUrl: './transportation-service-details.component.html',
})

export class TransportationServiceDetails implements OnInit{

    PROPERTY_BLOCK_FIELD_NAME: string = "name";
    PROPERTY_BLOCK_FIELD_ISCOLLAPSED = "isCollapsed";
    PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";
    PROPERTY_BLOCK_FIELD_PROPERTY_DETAILS = "propertyDetails";

    @Input() presentationMode: string;
    @Input() catalogueLine: CatalogueLine;
    @Input() parentForm: FormGroup;

    // keeping the collapsed state of property blocks. it is actually a reference to the actual kept in publish service
    propertyBlockCollapsedStates: Map<string, boolean> = new Map<string, boolean>();


    constructor(private publishService: PublishService) {
        this.propertyBlockCollapsedStates = this.publishService.getCollapsedStates();
    }

    ngOnInit(): void {
        if(this.catalogueLine.goodsItem.item.transportationServiceDetails == null) {
            this.catalogueLine.goodsItem.item.transportationServiceDetails = new TransportationService();
        }
    }

    toggleCollapsed(blockName:string):void {
        this.propertyBlockCollapsedStates.set(blockName, !this.propertyBlockCollapsedStates.get(blockName));
    }

    trackByIndex(index: any, item: any) {
        return index;
    }
}
