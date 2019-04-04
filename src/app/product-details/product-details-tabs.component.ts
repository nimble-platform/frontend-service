import { Component, Input, OnInit } from "@angular/core";
import { ProductDetailsTab } from "./model/product-details-tab";
import { ProductWrapper } from "../common/product-wrapper";
import { BpWorkflowOptions } from "../bpe/model/bp-workflow-options";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { getPropertyValuesAsStrings } from "../common/utils";
import { CompanySettings } from "../user-mgmt/model/company-settings";
import * as myGlobals from '../globals';

@Component({
    selector: 'product-details-tabs',
    templateUrl: './product-details-tabs.component.html',
    styleUrls: ['./product-details-tabs.component.css']
})
export class ProductDetailsTabsComponent implements OnInit {

    @Input() wrapper: ProductWrapper;
    @Input() options: BpWorkflowOptions;
    @Input() settings: CompanySettings;

    @Input() showOverview: boolean = false;
    @Input() readonly: boolean = false;
    config = myGlobals.config;

    selectedTab: ProductDetailsTab;

    isLogistics: boolean = false;

    constructor() {

    }

    ngOnInit() {
        this.selectedTab = this.showOverview ? "OVERVIEW" : "DETAILS";
        this.isLogistics = this.wrapper.getLogisticsStatus();
    }

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    getValuesAsString(property: ItemProperty): string[] {
        return getPropertyValuesAsStrings(property);
    }

    getHumanReadablePropertyName(propertyName:string): string{
        return propertyName.replace("Has", "");
    }
}