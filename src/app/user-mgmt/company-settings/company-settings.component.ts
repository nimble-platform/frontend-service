import { Component, OnInit } from "@angular/core";
import { UserService } from "../user.service";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../../globals";
import { CallStatus } from "../../common/call-status";
import { CompanySettings } from "../model/company-settings";
import { ActivatedRoute } from "@angular/router";
import { AppComponent } from "../../app.component";

type SelectedTab = "COMPANY_DATA"
    | "COMPANY_DESCRIPTION"
    | "NEGOTIATION_SETTINGS"
    | "DELIVERY_TERMS"
    | "CERTIFICATES"
    | "CATEGORIES";

@Component({
    selector: "company-settings",
    templateUrl: "./company-settings.component.html",
    styleUrls: ["./company-settings.component.css"]
})
export class CompanySettingsComponent implements OnInit {

    settings: CompanySettings;
    certificates: any;
    ppapLevel: any;
    selectedTab: SelectedTab = "COMPANY_DATA";
    initCallStatus: CallStatus = new CallStatus();
    profile_completeness: number = 0;
    profile_completeness_str: string = "0%";
    config = myGlobals.config;
    companyId = null;
    viewMode = "full";

    constructor(private cookieService: CookieService,
                private userService: UserService,
                public route: ActivatedRoute,
                public appComponent: AppComponent) {

    }

    ngOnInit() {
        this.initCallStatus.submit();
        this.route.queryParams.subscribe(params => {
          this.companyId = params['id'];
          if (params['viewMode'])
            this.viewMode = params['viewMode'];
          else
            this.viewMode = "full";
          if (this.companyId && this.appComponent.checkRoles("pm"))
            this.getCompanySettings(this.companyId);
        });
        const userId = this.cookieService.get("user_id");
        if (!this.companyId) {
          this.userService.getSettingsForUser(userId).then(settings => {
              this.processSettings(settings);
          })
          .catch(error => {
              this.initCallStatus.error("Error while fetching company settings", error);
          });
        }
        else {
          this.getCompanySettings(this.companyId);
        }
    }

    getCompanySettings(id) {
      this.userService.getSettingsForParty(id).then(settings => {
          this.processSettings(settings);
      })
      .catch(error => {
          this.initCallStatus.error("Error while fetching company settings", error);
      });
    }

    processSettings(settings) {
      if (myGlobals.debug) {
          console.log("Fetched settings: " + JSON.stringify(settings));
      }
      this.userService.getProfileCompleteness(settings.companyID).then(completeness => {
          this.profile_completeness = 0;
          this.profile_completeness_str = "0%";
          if (completeness.qualityIndicator && completeness.qualityIndicator.length>0) {
            for (var indicator of completeness.qualityIndicator) {
              if (indicator.qualityParameter == "PROFILE_COMPLETENESS") {
                if (indicator.quantity && indicator.quantity.value) {
                  this.profile_completeness = indicator.quantity.value;
                  this.profile_completeness_str = Math.round(indicator.quantity.value*100)+"%";
                }
              }
            }
          }
          this.initCallStatus.callback("Profile completeness successfully fetched", true);
      })
      .catch(error => {
          this.initCallStatus.error("Error while fetching profile completeness", error);
      });
      this.settings = settings;
      this.certificates = this.settings.certificates;
      if (this.settings.tradeDetails.ppapCompatibilityLevel && this.settings.tradeDetails.ppapCompatibilityLevel>0)
        this.ppapLevel = this.settings.tradeDetails.ppapCompatibilityLevel;
      else
        this.ppapLevel = 0;
      this.certificates.sort((a, b) => a.name.localeCompare(b.name));
      this.certificates.sort((a, b) => a.type.localeCompare(b.type));
      this.initCallStatus.callback("Settings successfully fetched", true);
    }

    onSelectTab(event: any) {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    onSettingsUpdated() {
        this.ngOnInit();
    }
}
