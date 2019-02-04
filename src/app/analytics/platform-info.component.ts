import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from '../common/call-status';
import * as myGlobals from '../globals';

@Component({
    selector: "platform-info",
    templateUrl: "./platform-info.component.html",
    styleUrls: ["./platform-info.component.css"]
})

export class PlatformInfoComponent implements OnInit {

    config = myGlobals.config;
    registeredCompaniesPage = null;
    registeredCompaniesCallStatus: CallStatus = new CallStatus();

    constructor(private analyticsService: AnalyticsService) {
    }

    ngOnInit(): void {
        this.registeredCompaniesCallStatus.submit();
        this.updateRegisteredCompanies(1);
    }

    updateRegisteredCompanies(requestedPage: number): void {
        this.analyticsService
            .getVerifiedCompanies(requestedPage)
            .then(res => {
                this.registeredCompaniesCallStatus.callback("Successfully loaded registered companies", true);
                res = this.updateLinks(res);
                this.registeredCompaniesPage = res;
                this.registeredCompaniesPage.number += 1; // number has offset of 1
            })
            .catch(error => {
                this.registeredCompaniesCallStatus.error("Error while loading registered companies page", error);
            });
    }

    updateLinks(regComp: any): any {
      if (regComp.content) {
        for (var i=0; i<regComp.content.length; i++) {
          if (regComp.content[i].websiteURI && regComp.content[i].websiteURI != "") {
            var comp_link = regComp.content[i].websiteURI;
            if (comp_link.indexOf("http://") == -1 && comp_link.indexOf("https://") == -1) {
              regComp.content[i].websiteURIFull = "http://"+regComp.content[i].websiteURI;
            }
            else {
              regComp.content[i].websiteURIFull = regComp.content[i].websiteURI;
            }
          }
        }
      }
      return regComp;
    }

    onRegisteredCompaniesPageChange(newPage): void {
        this.registeredCompaniesCallStatus.submit();
        if (newPage && newPage !== this.registeredCompaniesPage.number) {
            this.updateRegisteredCompanies(newPage);
        }
    }

}
