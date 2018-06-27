import { Component, Input, OnInit } from "@angular/core";
import { ProductDetailsTab } from "./model/product-details-tab";
import { ProductWrapper } from "./product-wrapper";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";

@Component({
    selector: 'product-details-tabs',
    templateUrl: './product-details-tabs.component.html',
    styleUrls: ['./product-details-tabs.component.css']
})
export class ProductDetailsTabsComponent implements OnInit {

    @Input() wrapper: ProductWrapper;
    @Input() options: BpWorkflowOptions;

    @Input() showOverview: boolean = false;
    @Input() readonly: boolean = false; // TODO use

    selectedTab: ProductDetailsTab;
    
    constructor() {

    }

    ngOnInit() {
        this.selectedTab = this.showOverview ? "OVERVIEW" : "DETAILS";
    }

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

}