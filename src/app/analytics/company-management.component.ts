import { Component, OnInit,Input } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from '../common/call-status';
import {selectPartyName} from '../common/utils';
import { CompanyManagementTab } from "./model/company-management-tab";
import {COMPANY_LIST_SORT_OPTIONS} from './constants';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "company-management",
    templateUrl: "./company-management.component.html",
    styleUrls: ["./company-management.component.css"]
})
export class CompanyManagementComponent implements OnInit {

    registeredCompaniesPage = null;
    orgCompaniesPage = null;
    verifiedExpanded = false;
    verifiedFilter = "";
    registeredCompaniesCallStatus: CallStatus = new CallStatus();

    unverifiedCompaniesPage = null;
    orgUnverifiedCompaniesPage = null;
    unverifiedExpanded = false;
    unverifiedFilter = "";
    unverifiedCompaniesCallStatus: CallStatus = new CallStatus();

    getNameOfTheCompany = selectPartyName;
    size = 10;

    @Input() showOverview: boolean = true;

    COMPANY_LIST_SORT_OPTIONS = COMPANY_LIST_SORT_OPTIONS;
    sortOptionForUnverifiedCompanies = this.COMPANY_LIST_SORT_OPTIONS[0].name;
    sortOptionForRegisteredCompanies = this.COMPANY_LIST_SORT_OPTIONS[0].name;

    selectedTab: CompanyManagementTab;

    constructor(private analyticsService: AnalyticsService,
      private translate: TranslateService,) {
        translate.setDefaultLang("en");
        translate.use(translate.getBrowserLang());
    }

    ngOnInit(): void {
        this.registeredCompaniesCallStatus.submit();
        this.unverifiedCompaniesCallStatus.submit();
        this.updateUnverifiedCompanies(1, this.COMPANY_LIST_SORT_OPTIONS[0].sortBy, this.COMPANY_LIST_SORT_OPTIONS[0].orderBy);
        this.updateRegisteredCompanies(1, this.COMPANY_LIST_SORT_OPTIONS[0].sortBy, this.COMPANY_LIST_SORT_OPTIONS[0].orderBy);
        this.selectedTab = this.showOverview? "UNVERIFIED" : "VERIFIED";

        //this.updateRegisteredCompanies(0);
    }

    updateRegisteredCompanies(requestedPage: number, sortBy?: string, orderBy?: string): void {
        this.analyticsService
            .getVerifiedCompanies(requestedPage, 99999, sortBy, orderBy)
            .then(res => {
                this.registeredCompaniesCallStatus.callback("Successfully loaded registered companies", true);
                this.orgCompaniesPage = res;
                this.orgCompaniesPage.number += 1; // number has offset of 1
                this.filterVerifiedCompanyPage();
            })
            .catch(error => {
                this.registeredCompaniesCallStatus.error("Error while loading registered companies page", error);
            });
    }

    onRegisteredCompaniesPageChange(newPage): void {
        this.registeredCompaniesCallStatus.submit();
        if (newPage && newPage !== this.registeredCompaniesPage.number) {
            let selectedSortOption = this.getSelectedSortOption(this.sortOptionForRegisteredCompanies);
            this.updateRegisteredCompanies(newPage, selectedSortOption.sortBy, selectedSortOption.orderBy);
        }
    }

    updateUnverifiedCompanies(requestedPage: number, sortBy?: string, orderBy?: string): void {

        this.analyticsService
            .getUnverifiedCompanies(requestedPage, sortBy, orderBy)
            .then(res => {
                this.unverifiedCompaniesCallStatus.callback("Successfully loaded unverified companies", true);
                this.orgUnverifiedCompaniesPage = res;
                this.orgUnverifiedCompaniesPage.number += 1; // number has offset of 1
                this.filterUnverifiedCompanyPage();
            })
            .catch(error => {
                this.unverifiedCompaniesCallStatus.error("Error while loading unverified companies", error);
            });
    }

    verifyCompany(company): void {
        if (confirm("Are you sure that you want to verify this company?")) {
          this.unverifiedCompaniesCallStatus.submit();
          this.registeredCompaniesCallStatus.submit();
          this.analyticsService.verifyCompany(company.hjid)
              .then(res => {
                  this.unverifiedCompaniesPage.content = this.unverifiedCompaniesPage.content.filter(c => c.hjid !== company.hjid);
                  this.updateUnverifiedCompanies(this.unverifiedCompaniesPage.number);
                  this.updateRegisteredCompanies(this.registeredCompaniesPage.number);
              })
              .catch(error => {
                  this.unverifiedCompaniesCallStatus.error("Error while verifing company", error);
              });
        }
    }

    rejectCompany(company): void {
        if (confirm("Are you sure that you want to reject this company?")) {
          this.unverifiedCompaniesCallStatus.submit();
          this.analyticsService.deleteCompany(company.hjid)
              .then(res => {
                  this.unverifiedCompaniesPage.content = this.unverifiedCompaniesPage.content.filter(c => c.hjid !== company.hjid);
                  this.updateUnverifiedCompanies(this.unverifiedCompaniesPage.number);
              })
              .catch(error => {
                  this.unverifiedCompaniesCallStatus.error("Error while rejecting company", error);
              });
        }
    }

    onUnverifiedPageChange(newPage): void {
        this.unverifiedCompaniesCallStatus.submit();
        if (newPage && newPage !== this.unverifiedCompaniesPage.number) {
            let selectedSortOption = this.getSelectedSortOption(this.sortOptionForUnverifiedCompanies);
            this.updateUnverifiedCompanies(newPage, selectedSortOption.sortBy, selectedSortOption.orderBy);
        }
    }

    sortUnverifiedCompanyList(): void {
        let selectedSortOption = this.getSelectedSortOption(this.sortOptionForUnverifiedCompanies);
        this.updateUnverifiedCompanies(1, selectedSortOption.sortBy, selectedSortOption.orderBy);
        this.unverifiedCompaniesCallStatus.submit();
        // this.unverifiedCompaniesPage = null;
    }

    sortRegisteredCompanyList(): void {
        let selectedSortOption = this.getSelectedSortOption(this.sortOptionForRegisteredCompanies);
        this.updateRegisteredCompanies(1, selectedSortOption.sortBy, selectedSortOption.orderBy);
        this.registeredCompaniesCallStatus.submit();
        // this.registeredCompaniesPage = null;
    }

    getSelectedSortOption(selectedName): any{
        let selectedSortOption = COMPANY_LIST_SORT_OPTIONS.filter(i => i.name === selectedName);
        return selectedSortOption[0];
    }

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    toggleVerifiedExpand() {
      this.verifiedExpanded = !this.verifiedExpanded;
      this.filterVerifiedCompanyPage();
    }

    toggleUnverifiedExpand() {
      this.unverifiedExpanded = !this.unverifiedExpanded;
      this.filterUnverifiedCompanyPage();
    }

    filterVerifiedCompanyPage() {
      this.registeredCompaniesPage = null;
      let remaining = 99999;
      if (!this.verifiedExpanded)
        remaining = this.size;
      for (let i=0; i<this.orgCompaniesPage.content.length; i++) {
        if (this.verifiedFilter != "" && remaining > 0) {
          let name = selectPartyName(this.orgCompaniesPage.content[i].partyName).toLowerCase();
          let filterLower = this.verifiedFilter.toLowerCase();
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
      this.buildVerifiedFilteredPage();
    }

    filterUnverifiedCompanyPage() {
      this.unverifiedCompaniesPage = null;
      let remaining = 99999;
      if (!this.unverifiedExpanded)
        remaining = this.size;
      for (let i=0; i<this.orgUnverifiedCompaniesPage.content.length; i++) {
        if (this.unverifiedFilter != "" && remaining > 0) {
          let name = selectPartyName(this.orgUnverifiedCompaniesPage.content[i].partyName).toLowerCase();
          let filterLower = this.unverifiedFilter.toLowerCase();
          if (name.indexOf(filterLower) == -1)
            this.orgUnverifiedCompaniesPage.content[i].display = false;
          else {
            this.orgUnverifiedCompaniesPage.content[i].display = true;
            remaining--;
          }
        }
        else if (remaining > 0) {
          this.orgUnverifiedCompaniesPage.content[i].display = true;
          remaining--;
        }
        else {
          this.orgUnverifiedCompaniesPage.content[i].display = false;
        }
      }
      this.buildUnverifiedFilteredPage();
    }

    buildVerifiedFilteredPage() {
       let tmpPage = JSON.parse(JSON.stringify(this.orgCompaniesPage));
       let tmpPageContent = [];
       for (let i=0; i<tmpPage.content.length; i++) {
         if (tmpPage.content[i].display)
           tmpPageContent.push(tmpPage.content[i]);
       }
       tmpPage.content = tmpPageContent;
       this.registeredCompaniesPage = tmpPage;
     }

     buildUnverifiedFilteredPage() {
        let tmpPage = JSON.parse(JSON.stringify(this.orgUnverifiedCompaniesPage));
        let tmpPageContent = [];
        for (let i=0; i<tmpPage.content.length; i++) {
          if (tmpPage.content[i].display)
            tmpPageContent.push(tmpPage.content[i]);
        }
        tmpPage.content = tmpPageContent;
        this.unverifiedCompaniesPage = tmpPage;
      }

}
