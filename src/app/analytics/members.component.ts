import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from '../common/call-status';
import * as myGlobals from '../globals';
import {selectPartyName, sanitizeLink} from '../common/utils';
import { AppComponent } from "../app.component";
import { ActivatedRoute } from "@angular/router";
import {COMPANY_LIST_SORT_OPTIONS} from './constants';

@Component({
    selector: "members-info",
    templateUrl: "./members.component.html",
    styleUrls: ["./members.component.css"]
})

export class MembersComponent implements OnInit {

    config = myGlobals.config;
    registeredCompaniesPage = null;
    registeredCompaniesCallStatus: CallStatus = new CallStatus();
    imgEndpoint = myGlobals.user_mgmt_endpoint+"/company-settings/image/";
    size = 16;

    getNameOfTheCompany = selectPartyName;
    getLink = sanitizeLink;

    COMPANY_LIST_SORT_OPTIONS = COMPANY_LIST_SORT_OPTIONS;
    sortOptionForVerifiedCompanies = this.COMPANY_LIST_SORT_OPTIONS[0].name;

    constructor(
      private analyticsService: AnalyticsService,
      public appComponent: AppComponent,
      private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params["size"]) {
              this.size = params["size"];
            }
            else {
              this.size = 16;
            }
        });
        this.registeredCompaniesCallStatus.submit();
        this.updateRegisteredCompanies(1, this.COMPANY_LIST_SORT_OPTIONS[0].sortBy, this.COMPANY_LIST_SORT_OPTIONS[0].orderBy);
    }

    updateRegisteredCompanies(requestedPage: number, sortBy?: string, orderBy?: string): void {
        this.analyticsService
            .getVerifiedCompanies(requestedPage,this.size, sortBy, orderBy)
            .then(res => {
                this.registeredCompaniesCallStatus.callback("Successfully loaded registered companies", true);
                this.registeredCompaniesPage = res;
                this.registeredCompaniesPage.number += 1; // number has offset of 1
            })
            .catch(error => {
                this.registeredCompaniesCallStatus.error("Error while loading registered companies page", error);
            });
    }

    getCompanyLogo(ref: any): string {
      var href = "assets/empty_img.png";
      if (ref) {
        var id = -1;
        for (var i=0; i<ref.length; i++) {
          if (ref[i].documentType && ref[i].hjid && ref[i].documentType=="CompanyLogo")
            id = ref[i].hjid;
        }
        if (id != -1)
          href = this.imgEndpoint+""+id;
      }
      return href;
    }

    onRegisteredCompaniesPageChange(newPage): void {
        this.registeredCompaniesCallStatus.submit();
        if (newPage && newPage !== this.registeredCompaniesPage.number) {
            let selectedSortOption = COMPANY_LIST_SORT_OPTIONS.filter(i => i.name === this.sortOptionForVerifiedCompanies);
            this.updateRegisteredCompanies(newPage, selectedSortOption[0].sortBy, selectedSortOption[0].orderBy);
        }
    }

    sortRegisteredCompanyList(): void {
        let selectedSortOption = COMPANY_LIST_SORT_OPTIONS.filter(i => i.name === this.sortOptionForVerifiedCompanies);
        this.updateRegisteredCompanies(1, selectedSortOption[0].sortBy, selectedSortOption[0].orderBy);
        this.registeredCompaniesCallStatus.submit();
        this.registeredCompaniesPage = null;
    }

}
