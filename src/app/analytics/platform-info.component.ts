import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from '../common/call-status';
import * as myGlobals from '../globals';
import {selectPartyName} from '../common/utils';

@Component({
    selector: "platform-info",
    templateUrl: "./platform-info.component.html",
    styleUrls: ["./platform-info.component.css"]
})

export class PlatformInfoComponent implements OnInit {

    config = myGlobals.config;
    registeredCompaniesPage = null;
    registeredCompaniesCallStatus: CallStatus = new CallStatus();

    getNameOfTheCompany = selectPartyName;

    constructor(private analyticsService: AnalyticsService) {
    }

    ngOnInit(): void {
        this.registeredCompaniesCallStatus.submit();
        this.updateRegisteredCompanies(0);
    }

    updateRegisteredCompanies(requestedPage: number): void {
        this.analyticsService
            .getAllParties(requestedPage)
            .then(res => {
                this.registeredCompaniesCallStatus.callback("Successfully loaded registered companies", true);
                this.registeredCompaniesPage = res;
            })
            .catch(error => {
                this.registeredCompaniesCallStatus.error("Error while loading registered companies page", error);
            });
    }

    onRegisteredCompaniesPageChange(newPage): void {
        this.registeredCompaniesCallStatus.submit();
        if (newPage && newPage !== (this.registeredCompaniesPage.number+1)) {
            this.updateRegisteredCompanies(newPage-1);
        }
    }

}
