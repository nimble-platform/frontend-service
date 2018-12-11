import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from '../common/call-status';

@Component({
    selector: "company-management",
    templateUrl: "./company-management.component.html",
    styleUrls: ["./company-management.component.css"]
})
export class CompanyManagementComponent implements OnInit {

    registeredCompaniesPage = null;
    registeredCompaniesCallStatus: CallStatus = new CallStatus();

    unverifiedCompaniesPage = null;
    unverifiedCompaniesCallStatus: CallStatus = new CallStatus();

    constructor(private analyticsService: AnalyticsService) {
    }

    ngOnInit(): void {
        this.registeredCompaniesCallStatus.submit();
        this.unverifiedCompaniesCallStatus.submit();
        this.updateUnverifiedCompanies(1);
        this.updateRegisteredCompanies(1);
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
        if (newPage && newPage !== this.registeredCompaniesPage.number) {
            this.updateRegisteredCompanies(newPage);
        }
    }

    updateUnverifiedCompanies(requestedPage: number): void {

        this.analyticsService
            .getUnverifiedCompanies(requestedPage)
            .then(res => {
                this.unverifiedCompaniesCallStatus.callback("Successfully loaded unverified companies", true);
                this.unverifiedCompaniesPage = res;
                this.unverifiedCompaniesPage.number += 1; // number has offset of 1
            })
            .catch(error => {
                this.unverifiedCompaniesCallStatus.error("Error while loading unverified companies", error);
            });
    }

    verifyCompany(company): void {
        if (confirm("Are you sure that you want to verify this company?")) {
          this.unverifiedCompaniesCallStatus.submit();
          this.analyticsService.verifyCompany(company.hjid)
              .then(res => {
                  this.unverifiedCompaniesPage.content = this.unverifiedCompaniesPage.content.filter(c => c.hjid !== company.hjid);
                  this.updateUnverifiedCompanies(this.unverifiedCompaniesPage.number);
              })
              .catch(error => {
                  this.unverifiedCompaniesCallStatus.error("Error while verifing company", error);
              });
        }
    }

    onUnverifiedPageChange(newPage): void {
        this.unverifiedCompaniesCallStatus.submit();
        if (newPage && newPage !== this.unverifiedCompaniesPage.number) {
            this.updateUnverifiedCompanies(newPage);
        }
    }
}
