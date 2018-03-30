import {Component, OnInit} from "@angular/core";
import {BPDataService} from "../bp-data-service";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})

export class NegotiationComponent implements OnInit {
    tabs:string[] = [];
	selectedTab: string = "Request for Quotation Details";

    constructor(private bpDataService:BPDataService) {
    }

    ngOnInit() {
		if(this.bpDataService.requestForQuotation == null) {
			this.bpDataService.initRfq();
		}
		this.populateTabs();
	}

    populateTabs() {
        if(this.bpDataService.getCatalogueLine().goodsItem.item.transportationServiceDetails == null) {
            this.tabs.push('Product Characteristics');
            this.tabs.push('Product Trading & Delivery Terms');
        } else {
            this.tabs.push('Service Characteristics');
        }
    }
}