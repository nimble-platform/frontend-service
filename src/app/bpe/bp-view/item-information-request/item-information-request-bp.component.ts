import {Component, OnInit} from "@angular/core";
import {BPDataService} from "../bp-data-service";
/**
 * Created by suat on 19-Nov-17.
 */
@Component({
    selector: 'item-information-request-bp',
    templateUrl: './item-information-request-bp.component.html'
})

export class ItemInformationRequestBpComponent implements OnInit {

    selectedTab: string = "Item Information Request Details";
    tabs:string[] = [];

    constructor(private bpDataService: BPDataService) {
    }

    ngOnInit() {
        if(this.bpDataService.itemInformationRequest == null) {
            // initiating a new business process from scratch
            this.bpDataService.initItemInformationRequest();
        }
        this.populateTabs();
    }

    populateTabs() {
        if(this.bpDataService.catalogueLine.goodsItem.item.transportationServiceDetails == null) {
            this.tabs.push('Product Characteristics');
            this.tabs.push('Product Trading & Delivery Terms');
        } else {
            this.tabs.push('Service Characteristics');
        }
    }
}