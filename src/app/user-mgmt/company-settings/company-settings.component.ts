/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit } from "@angular/core";
import { UserService } from "../user.service";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../../globals";
import { CallStatus } from "../../common/call-status";
import { CompanySettings } from "../model/company-settings";
import { ActivatedRoute } from "@angular/router";
import { AppComponent } from "../../app.component";
import { TranslateService } from '@ngx-translate/core';
import { FEDERATIONID } from '../../catalogue/model/constants';

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
    federationId = null;
    viewMode = "full";

    constructor(private cookieService: CookieService,
        private userService: UserService,
        public route: ActivatedRoute,
        private translate: TranslateService,
        public appComponent: AppComponent) {

    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.companyId = params['id'];
            this.federationId = params['delegateId'];
            if(params['tab']){
                this.selectedTab = params['tab'];
            }
            if (!this.federationId) {
                this.federationId = FEDERATIONID();
            }
            if (params['viewMode'])
                this.viewMode = params['viewMode'];
            else
                this.viewMode = "full";
            // platform manager should be able to see  all details of the company
            let isPlatformManager = this.appComponent.checkRoles("pm");
            if(isPlatformManager){
                this.viewMode = "full";
            }
            if (this.companyId && isPlatformManager)
                this.getCompanySettings(this.companyId, this.federationId);
        });
        const userId = this.cookieService.get("user_id");
        if (!this.companyId) {
            this.initCallStatus.aggregatedSubmit();
            this.userService.getSettingsForUser(userId).then(settings => {
                this.processSettings(settings);
                this.initCallStatus.aggregatedCallBack("Settings successfully fetched",true)
            })
                .catch(error => {
                    this.initCallStatus.aggregatedError("Error while fetching company settings", error);
                });
        }
        else {
            this.getCompanySettings(this.companyId, this.federationId);
        }
    }

    getCompanySettings(id, federationId) {
        this.initCallStatus.aggregatedSubmit();
        this.userService.getSettingsForParty(id, federationId).then(settings => {
            this.processSettings(settings);
            this.initCallStatus.aggregatedCallBack("Settings successfully fetched",true)
        })
        .catch(error => {
            this.initCallStatus.aggregatedError("Error while fetching company settings", error);
        });
    }

    processSettings(settings) {
        if (myGlobals.debug) {
            console.log("Fetched settings: " + JSON.stringify(settings));
        }
        this.initCallStatus.aggregatedSubmit();
        this.userService.getProfileCompleteness(settings.companyID).then(completeness => {
            this.profile_completeness = 0;
            this.profile_completeness_str = "0%";
            if (completeness.qualityIndicator && completeness.qualityIndicator.length > 0) {
                for (var indicator of completeness.qualityIndicator) {
                    if (indicator.qualityParameter == "PROFILE_COMPLETENESS") {
                        if (indicator.quantity && indicator.quantity.value) {
                            this.profile_completeness = indicator.quantity.value;
                            this.profile_completeness_str = Math.round(indicator.quantity.value * 100) + "%";
                        }
                    }
                }
            }
            this.initCallStatus.aggregatedCallBack("Profile completeness successfully fetched", true);
        })
            .catch(error => {
                this.initCallStatus.aggregatedError("Error while fetching profile completeness", error);
            });
        this.settings = settings;
        this.certificates = this.settings.certificates;
        if (this.settings.tradeDetails.ppapCompatibilityLevel && this.settings.tradeDetails.ppapCompatibilityLevel > 0)
            this.ppapLevel = this.settings.tradeDetails.ppapCompatibilityLevel;
        else
            this.ppapLevel = 0;
        this.certificates.sort((a, b) => a.name.localeCompare(b.name));
        this.certificates.sort((a, b) => a.type.localeCompare(b.type));
    }

    onSelectTab(event: any, id: any) {
        event.preventDefault();
        this.selectedTab = id;
    }

    onSettingsUpdated() {
        this.ngOnInit();
    }
}
