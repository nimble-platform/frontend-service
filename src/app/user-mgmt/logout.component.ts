/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
 * UB - University of Bremen, Faculty of Production Engineering; Bremen; Germany
 * BIBA - Bremer Institut für Produktion und Logistik GmbH; Bremen; Germany
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

import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CookieService } from 'ng2-cookies';
import { UserService } from './user.service';
import { CategoryService } from '../catalogue/category/category.service';
import { CredentialsService } from './credentials.service';
import { CatalogueService } from '../catalogue/catalogue.service';
import * as constants from "../common/constants";
import { Headers, Http } from "@angular/http";
import * as myGlobals from "../globals";
import { TranslateService } from '@ngx-translate/core';
import * as moment from "moment";
import { ShoppingCartDataService } from '../bpe/shopping-cart/shopping-cart-data-service';


@Component({
    selector: 'nimble-logout',
    providers: [CookieService],
    templateUrl: './logout.component.html'
})

export class LogoutComponent implements OnInit {

    public config = myGlobals.config;
    companyId = "";
    userId = "";
    public debug = myGlobals.debug;

    constructor(
        private cookieService: CookieService,
        private appComponent: AppComponent,
        private userService: UserService,
        private categoryService: CategoryService,
        private catalogueService: CatalogueService,
        private shoppingCartDataService: ShoppingCartDataService,
        private translate: TranslateService,
        private credentialsService: CredentialsService,
        private http: Http
    ) { }

    ngOnInit() {

        this.companyId = this.cookieService.get("company_id");
        this.userId = this.cookieService.get("user_id");
        this.cookieService.delete("user_id");
        this.cookieService.delete("company_id");
        this.cookieService.delete("user_fullname");
        this.cookieService.delete("user_email");
        this.userService.resetData();
        this.categoryService.resetData();
        this.catalogueService.resetData();
        this.cookieService.delete("active_company_name");
        this.cookieService.delete("show_welcome");
        this.cookieService.delete("bearer_token");
        this.shoppingCartDataService.resetData();

        // if rocket chat enabled

        let headers = new Headers({ 'Content-Type': 'application/json', 'X-Auth-Token': this.cookieService.get(constants.chatToken), 'X-User-Id': this.cookieService.get(constants.chatUserID) });
        const url = myGlobals.rocketChatEndpoint + '/api/v1/logout';
        this.http
            .post(url, JSON.stringify({}), { headers: headers })
            .toPromise()
            .then(res => {
                console.log(res);
                this.cookieService.delete(constants.chatRCConnect, '/');
                this.cookieService.delete(constants.chatRCToken, '/');
                this.cookieService.delete(constants.chatRCID, '/');

                this.cookieService.delete(constants.chatToken, '/');
                this.cookieService.delete(constants.chatUsername, '/');
                this.cookieService.delete(constants.chatUserID, '/');
            })
            .catch(e => {
                console.error("Error occurred while logging off from rocket chat");
            });

        if (this.config.loggingEnabled) {
            let cID = "";
            if (this.companyId) {
                cID = this.companyId;
                let params = {};

                let log = {
                    "@timestamp": moment().utc().toISOString(),
                    "level": "INFO",
                    "serviceID": "frontend-service",
                    "companyId": cID,
                    "userId": this.userId,
                    "activity": "logout",
                    "message": JSON.stringify({
                        "params": params
                    })
                };
                if (this.debug)
                    console.log("Writing log " + JSON.stringify(log));
                this.credentialsService.logUrl(log)
                    .then(res => { })
                    .catch(error => { });
            }

        }
        this.userService.resetData();
        this.appComponent.checkLogin("/homepage");
    }

}
