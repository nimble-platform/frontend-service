import { Component, OnInit } from "@angular/core";
import { UserService } from "../user.service";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../../globals";
import { CallStatus } from "../../common/call-status";
import { CompanySettings } from "../model/company-settings";

type SelectedTab = "COMPANY_DATA"
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

    constructor(private cookieService: CookieService,
                private userService: UserService) {

    }

    ngOnInit() {
        this.initCallStatus.submit();
        const userId = this.cookieService.get("user_id");
        this.userService.getSettingsForUser(userId).then(settings => {
            if (myGlobals.debug) {
                console.log("Fetched settings: " + JSON.stringify(settings));
            }

            this.settings = settings;
            this.certificates = this.settings.certificates;
            if (this.settings.ppapCompatibilityLevel && this.settings.ppapCompatibilityLevel>0)
              this.ppapLevel = this.settings.ppapCompatibilityLevel;
            else
              this.ppapLevel = 0;
            this.certificates.sort((a, b) => a.name.localeCompare(b.name));
            this.certificates.sort((a, b) => a.type.localeCompare(b.type));
            this.initCallStatus.callback("Settings successfully fetched", true);
        })
        .catch(error => {
            this.initCallStatus.error("Error while fetching company settings", error);
        });
    }

    onSelectTab(event: any) {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    onSettingsUpdated() {
        this.ngOnInit();
    }
}
