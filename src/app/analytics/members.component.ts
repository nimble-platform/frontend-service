/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { Component, OnInit, Input } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from '../common/call-status';
import * as myGlobals from '../globals';
import { sanitizeLink, copy } from '../common/utils';
import { AppComponent } from "../app.component";
import { ActivatedRoute } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { SimpleSearchService } from "../simple-search/simple-search.service";
import { Search } from "./model/search";
import { debounceTime, distinctUntilChanged, switchMap } from "rxjs/operators";
import { Observable } from "rxjs/Observable";

@Component({
    selector: "members-info",
    templateUrl: "./members.component.html",
    styleUrls: ["./members.component.css"]
})

export class MembersComponent implements OnInit {

    @Input() unverified: boolean = false;
    @Input() mgmt_view: boolean = false;
    @Input() rows: number = 12;
    companiesCallStatus: CallStatus = new CallStatus();
    config = myGlobals.config;
    size = 0;
    page = 1;
    start = 0;
    end = 0;
    totalElements = 0;
    model = new Search('');
    q = "";
    q_submit = "";
    sort = "legalName asc";
    response: any;
    temp: any;
    product_vendor_img = myGlobals.product_vendor_img;
    product_vendor_name = myGlobals.product_vendor_name;
    product_vendor_brand_name = myGlobals.product_vendor_brand_name;
    imgEndpoint = myGlobals.user_mgmt_endpoint + "/company-settings/image/";
    getLink = sanitizeLink;

    constructor(
        private analyticsService: AnalyticsService,
        public appComponent: AppComponent,
        private route: ActivatedRoute,
        private simpleSearchService: SimpleSearchService,
        private translate: TranslateService
    ) {
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params["size"]) {
                this.rows = params["size"];
            }
        });
        if (this.mgmt_view) {
            if (!this.appComponent.checkRoles("pm"))
                this.mgmt_view = false;
        }
        this.model.q = "*";
        this.getCompanies();
    }

    getCompanies() {
        this.companiesCallStatus.submit();
        if (this.model.q == "") {
            this.model.q = "*";
        }
        this.q_submit = this.model.q;
        if (this.model.q == "*") {
            this.model.q = "";
        }
        this.simpleSearchService.getComp(this.q_submit, [], [], this.page, this.rows, this.sort, this.unverified, true)
            .then(res => {
                this.companiesCallStatus.callback("Successfully loaded companies", true);
                if (this.q_submit == "*")
                    this.totalElements = res.totalElements;
                if (res.result.length == 0) {
                    this.response = res.result;
                    this.size = res.totalElements;
                    this.start = this.page * this.rows - this.rows + 1;
                    this.end = this.start + res.result.length - 1;
                }
                else {
                    this.temp = res.result;
                    for (let doc in this.temp) {
                        if (this.temp[doc][this.product_vendor_img]) {
                            var img = this.temp[doc][this.product_vendor_img];
                            if (Array.isArray(img)) {
                                this.temp[doc][this.product_vendor_img] = img[0];
                            }
                        }
                    }
                    this.response = copy(this.temp);
                    this.size = res.totalElements;
                    this.start = this.page * this.rows - this.rows + 1;
                    this.end = this.start + res.result.length - 1;
                }
            })
            .catch(error => {
                this.companiesCallStatus.error("Error while loading companies", error);
            });
    }

    getCompSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap(term =>
                this.simpleSearchService.getCompSuggestions(term, [this.product_vendor_name, ("{LANG}_" + this.product_vendor_brand_name)], true)
            )
        );

    verifyCompany(id): void {
        if (confirm("Are you sure that you want to verify this company?")) {
            this.companiesCallStatus.submit();
            this.analyticsService.verifyCompany(id)
                .then(res => {
                    this.companiesCallStatus.callback("Successfully verified company", true);
                    this.searchCompany();
                })
                .catch(error => {
                    this.companiesCallStatus.error("Error while verifing company", error);
                });
        }
    }

    rejectCompany(id): void {
        if (confirm("Are you sure that you want to reject this company?")) {
            this.companiesCallStatus.submit();
            this.analyticsService.rejectCompany(id)
                .then(res => {
                    this.companiesCallStatus.callback("Successfully rejected company", true);
                    this.searchCompany();
                })
                .catch(error => {
                    this.companiesCallStatus.error("Error while rejecting company", error);
                });
        }
    }

    deleteCompany(id): void {
        if (confirm("Are you sure that you want to delete this company?")) {
            this.companiesCallStatus.submit();
            this.analyticsService.deleteCompany(id)
                .then(res => {
                    this.companiesCallStatus.callback("Successfully deleted company", true);
                    this.searchCompany();
                })
                .catch(error => {
                    this.companiesCallStatus.error("Error while deleting company", error);
                });
        }
    }

    setSort(val: string) {
        this.size = 0;
        this.page = 1;
        this.start = 0;
        this.end = 0;
        this.sort = val;
        this.getCompanies();
    }

    searchCompany() {
        this.size = 0;
        this.page = 1;
        this.start = 0;
        this.end = 0;
        // if there is a search term, sort the search results by relevance , otherwise sort them by their legal name
        this.sort = this.model.q == "" ? "legalName asc" :'score desc';
        this.getCompanies();
    }

    resetSearch() {
        this.model.q = "*";
        this.size = 0;
        this.page = 1;
        this.start = 0;
        this.end = 0;
        this.getCompanies();
    }

}
