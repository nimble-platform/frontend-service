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

import {Component, OnDestroy, OnInit} from '@angular/core';
import { AppComponent } from "../app.component";
import { CookieService } from "ng2-cookies";
import { BPEService } from "../bpe/bpe.service";
import { UserService } from '../user-mgmt/user.service';
import { ActivatedRoute, Router } from "@angular/router";
import { TABS } from "./constants";
import { DashboardUser } from "./model/dashboard-user";
import * as myGlobals from '../globals';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {DEFAULT_LANGUAGE, FEDERATION, FEDERATIONID} from '../catalogue/model/constants';
import { Subject } from 'rxjs';
import {NetworkCompanyListService} from '../user-mgmt/network-company-list.service';

@Component({
    selector: "dashboard-threaded",
    templateUrl: "./dashboard-threaded.component.html",
    styleUrls: ["./dashboard-threaded.component.css"]
})
export class DashboardThreadedComponent implements OnInit, OnDestroy {

    user: DashboardUser;
    selectedTab: string;
    instance: string;

    buyerCounter = 0;
    sellerCounter = 0;

    catalogueViewMode:"OwnerView"|"ContractView"|"OfferView" = "OwnerView";
    ngUnsubscribe: Subject<void> = new Subject<void>();
    delegated = (FEDERATION() == "ON");

    TABS = TABS;
    public config = myGlobals.config;
    welcomeMessage = null;

    constructor(
        private cookieService: CookieService,
        private modalService: NgbModal,
        private bpeService: BPEService,
        private userService: UserService,
        private networkCompanyListService: NetworkCompanyListService,
        private router: Router,
        private route: ActivatedRoute,
        public appComponent: AppComponent
    ) { }

    ngOnInit() {
        if (this.config.welcomeMessage[DEFAULT_LANGUAGE()])
            this.welcomeMessage = this.config.welcomeMessage[DEFAULT_LANGUAGE()];
        else
            this.welcomeMessage = this.config.welcomeMessage["en"];
        this.computeUserFromCookies();
        this.getTabCounters();
        this.route.queryParams.subscribe(params => {
            if (params['ins'])
                this.instance = params['ins'];
            else
                this.instance = FEDERATIONID();
            this.selectedTab = this.sanitizeTab(params['tab']);

            // searchRef is true if the searchRef parameter is set
            let searchRef = !!params['searchRef'];

            if(searchRef && this.networkCompanyListService.productOfferingDetails != null){
                this.catalogueViewMode = "OfferView";
            }
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    onChangeTab(event: any, id: any): void {
        event.preventDefault();
        // the user should be logged in to switch between the dashboard tabs
        if(!this.cookieService.get("user_id") && this.selectedTab != TABS.SALES && this.selectedTab != TABS.PURCHASES && this.selectedTab != TABS.PROJECTS){
            this.appComponent.checkLogin("/user-mgmt/login");
        }
        this.router.navigate(['dashboard'], { queryParams: {tab: id} });
    }

    onCloseWelcomeTab(event: any): void {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.user.showWelcomeTab = false;
        this.userService.setWelcomeFlag(false)
            .then(res => {
                this.cookieService.set("show_welcome", "false");
            });
        if (this.selectedTab === TABS.WELCOME) {
            if (this.appComponent.checkRoles('purchases'))
                this.selectedTab = TABS.PURCHASES;
            else if (this.appComponent.checkRoles('sales'))
                this.selectedTab = TABS.SALES;
            else
                this.selectedTab = TABS.CATALOGUE;
        }
    }

    /*
     * Internal methods.
     */

    private computeUserFromCookies(): void {
        this.user = new DashboardUser(
            this.cookieService.get("user_fullname") || ""
        )

        if (this.cookieService.get("user_id") && this.cookieService.get("company_id")) {
            this.user.hasCompany = this.cookieService.get("company_id") !== "null"
        } else {
            this.appComponent.checkLogin("/user-mgmt/login");
        }

        if (this.cookieService.get("bearer_token")) {
            const at = this.cookieService.get("bearer_token");
            if (at.split(".").length == 3) {
                const at_payload = at.split(".")[1];
                try {
                    const at_payload_json = JSON.parse(atob(at_payload));
                    const at_payload_json_roles = at_payload_json["realm_access"]["roles"];
                    this.user.roles = at_payload_json_roles;
                } catch (e) { }
            }
        }

        this.user.showWelcomeTab = this.cookieService.get("show_welcome") === "true";

    }

    private getTabCounters() {
        this.buyerCounter = 0;
        this.sellerCounter = 0;
        this.bpeService
            .getActionRequiredCounter(this.cookieService.get("company_id"))
            .then(response => {
                this.buyerCounter = parseInt(response.buyer);
                this.sellerCounter = parseInt(response.seller);
            });
    }

    private sanitizeTab(tab: string): string {
        if (!tab) {
            if (this.selectedTab) {
                return this.selectedTab;
            }
            if (this.user.showWelcomeTab || this.config.permanentWelcomeTab) {
                return TABS.WELCOME;
            }
        } else {
            const upped = tab.toUpperCase()
            if (upped === TABS.CATALOGUE ||
                upped === TABS.SALES ||
                upped === TABS.WELCOME ||
                upped === TABS.FAVOURITE ||
                upped == TABS.COMPARE ||
                upped == TABS.PROJECTS ||
                upped === TABS.DEMANDS ||
                upped == TABS.PERFORMANCE ||
                upped == TABS.FRAME_CONTRACTS ||
                upped == TABS.UNSHIPPED_ORDERS ||
                upped == TABS.COLLABORATION) {
                return upped;
            }
        }
        if (this.appComponent.checkRoles('purchases'))
            return TABS.PURCHASES;
        if (this.appComponent.checkRoles('sales'))
            return TABS.SALES;
        if (this.appComponent.checkRoles('catalogue'))
            return TABS.CATALOGUE;
        if (this.config.collaborationEnabled && this.appComponent.checkRoles('collaboration'))
            return TABS.COLLABORATION;
        if (this.appComponent.checkRoles('favourite'))
            return TABS.FAVOURITE;
        if (this.appComponent.checkRoles('compare'))
            return TABS.COMPARE;
        if (this.config.projectsEnabled && this.appComponent.checkRoles('projects'))
            return TABS.PROJECTS;
        if (this.appComponent.checkRoles('performance'))
            return TABS.PERFORMANCE;
        return null;
    }
}
