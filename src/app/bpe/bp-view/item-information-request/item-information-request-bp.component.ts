import {Component, Input, OnInit} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import {Router} from "@angular/router";
/**
 * Created by suat on 19-Nov-17.
 */
@Component({
    selector: 'item-information-request-bp',
    templateUrl: './item-information-request-bp.component.html'
})

export class ItemInformationRequestBpComponent implements OnInit {
    @Input() presentationMode: string;
    selectedTab: string = "Item Information Request Details";
    tabs:string[] = [];

    constructor(private bpDataService: BPDataService,
                private router: Router) {
    }

    ngOnInit() {
        if(this.bpDataService.userRole == null) {
            this.router.navigate(['dashboard']);
        }

        if(this.bpDataService.itemInformationRequest == null) {
            // initiating a new business process from scratch
            this.bpDataService.initItemInformationRequest();
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