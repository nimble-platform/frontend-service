import { Component, OnInit,Input } from "@angular/core";
import { CompanyManagementTab } from "./model/company-management-tab";
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "company-management",
    templateUrl: "./company-management.component.html",
    styleUrls: ["./company-management.component.css"]
})
export class CompanyManagementComponent implements OnInit {

    @Input() showOverview: boolean = true;

    selectedTab: CompanyManagementTab;

    constructor(private translate: TranslateService) {
    }

    ngOnInit(): void {
        this.selectedTab = this.showOverview? "UNVERIFIED" : "VERIFIED";
    }

    onSelectTab(event: any, id: any): void {
        event.preventDefault();
        this.selectedTab = id;
    }

}
