import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from '../common/call-status';
import * as myGlobals from '../globals';
import {selectPartyName, sanitizeLink} from '../common/utils';
import { AppComponent } from "../app.component";
import { ActivatedRoute } from "@angular/router";
import {COMPANY_LIST_SORT_OPTIONS} from './constants';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "members-info",
    templateUrl: "./members.component.html",
    styleUrls: ["./members.component.css"]
})

export class MembersComponent implements OnInit {

    config = myGlobals.config;
    registeredCompaniesPage = null;
    orgCompaniesPage = null;
    registeredCompaniesCallStatus: CallStatus = new CallStatus();
    imgEndpoint = myGlobals.user_mgmt_endpoint+"/company-settings/image/";
    size = 12;
    expanded = false;
    filter = "";

    getNameOfTheCompany = selectPartyName;
    getLink = sanitizeLink;

    COMPANY_LIST_SORT_OPTIONS = COMPANY_LIST_SORT_OPTIONS;
    sortOptionForVerifiedCompanies = this.COMPANY_LIST_SORT_OPTIONS[0].name;

    constructor(
      private analyticsService: AnalyticsService,
      public appComponent: AppComponent,
      private route: ActivatedRoute,
      private translate: TranslateService,
    ) {
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params["size"]) {
              this.size = params["size"];
            }
            else {
              this.size = 12;
            }
        });
        this.registeredCompaniesCallStatus.submit();
        this.updateRegisteredCompanies(1, this.COMPANY_LIST_SORT_OPTIONS[0].sortBy, this.COMPANY_LIST_SORT_OPTIONS[0].orderBy);
    }

    updateRegisteredCompanies(requestedPage: number, sortBy?: string, orderBy?: string): void {
        this.analyticsService
            .getVerifiedCompanies(requestedPage,99999, sortBy, orderBy)
            .then(res => {
                this.registeredCompaniesCallStatus.callback("Successfully loaded registered companies", true);
                this.orgCompaniesPage = res;
                this.orgCompaniesPage.number += 1; // number has offset of 1
                this.filterCompanyPage();
            })
            .catch(error => {
                this.registeredCompaniesCallStatus.error("Error while loading registered companies page", error);
            });
    }

    toggleExpand() {
      this.expanded = !this.expanded;
      this.filterCompanyPage();
    }

    filterCompanyPage() {
      this.registeredCompaniesPage = null;
      let remaining = 99999;
      if (!this.expanded)
        remaining = this.size;
      for (let i=0; i<this.orgCompaniesPage.content.length; i++) {
        if (this.filter != "" && remaining > 0) {
          let name = selectPartyName(this.orgCompaniesPage.content[i].partyName).toLowerCase();
          let filterLower = this.filter.toLowerCase();
          if (name.indexOf(filterLower) == -1)
            this.orgCompaniesPage.content[i].display = false;
          else {
            this.orgCompaniesPage.content[i].display = true;
            remaining--;
          }
        }
        else if (remaining > 0) {
          this.orgCompaniesPage.content[i].display = true;
          remaining--;
        }
        else {
          this.orgCompaniesPage.content[i].display = false;
        }
      }
      this.buildFilteredPage();
    }

    buildFilteredPage() {
      let tmpPage = JSON.parse(JSON.stringify(this.orgCompaniesPage));
      let tmpPageContent = [];
      for (let i=0; i<tmpPage.content.length; i++) {
        if (tmpPage.content[i].display)
          tmpPageContent.push(tmpPage.content[i]);
      }
      tmpPage.content = tmpPageContent;
      this.registeredCompaniesPage = tmpPage;
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
        this.orgCompaniesPage = null;
    }

}
