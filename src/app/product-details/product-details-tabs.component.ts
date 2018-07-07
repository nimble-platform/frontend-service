import { Component, Input, OnInit } from "@angular/core";
import { ProductDetailsTab } from "./model/product-details-tab";
import { ProductWrapper } from "../common/product-wrapper";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { getPropertyValuesAsStrings } from "../common/utils";

@Component({
    selector: 'product-details-tabs',
    templateUrl: './product-details-tabs.component.html',
    styleUrls: ['./product-details-tabs.component.css']
})
export class ProductDetailsTabsComponent implements OnInit {

    @Input() wrapper: ProductWrapper;
    @Input() options: BpWorkflowOptions;

    @Input() showOverview: boolean = false;
    @Input() readonly: boolean = false;

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

    getValuesAsString(property: ItemProperty): string[] {
        return getPropertyValuesAsStrings(property);
    }
}