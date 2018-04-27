import {Component, OnInit} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import {SearchContextService} from '../../../simple-search/search-context.service';
import {Router} from '@angular/router';
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'order-bp',
    templateUrl: './order-bp.component.html'
})

export class OrderBpComponent implements OnInit {

    selectedTab: string = "Order Details";
    tabs:string[] = [];

    constructor(private bpDataService: BPDataService,
                private searchContextService: SearchContextService,
                private router:Router) {
    }

    ngOnInit() {
        if(this.bpDataService.order == null) {
            // initiating a new business process from scratch
            this.bpDataService.initOrder();
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

    searchTransportServiceProvider() {
        this.searchContextService.targetPartyRole = 'Transport Service Provider';
        this.searchContextService.associatedProcessType = 'Order';
        this.searchContextService.associatedProcessMetadata = this.bpDataService.processMetadata;
        this.bpDataService.setBpOptionParameters('buyer', 'Transport_Execution_Plan');
        this.router.navigate(['simple-search'], {queryParams: {searchContext: 'orderbp'}});
    }
}