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

import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Credentials } from './model/credentials';
import { CredentialsService } from './credentials.service';
import * as myGlobals from '../globals';
import { CookieService } from 'ng2-cookies';
import { CallStatus } from '../common/call-status';
import { copy, selectValueOfTextObject } from '../common/utils';
import { CategoryService } from '../catalogue/category/category.service';
import * as constants from "../common/constants";
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import {DemandService} from '../demand/demand-service';
//declare var jsSHA: any;

@Component({
    selector: 'credentials-form',
    providers: [CookieService],
    templateUrl: './credentials-form.component.html'
})

export class CredentialsFormComponent implements OnInit {

    debug = myGlobals.debug;
    config = myGlobals.config;
    pwLink = myGlobals.pw_reset_link;
    model = new Credentials('', '');
    objToSubmit = new Credentials('', '');
    response: any;
    shaObj: any;
    showLoginFederation = myGlobals.config.showLoginFederation;
    federationURL = "";

    submitCallStatus: CallStatus = new CallStatus();

    redirect = "";

    constructor(
        private credentialsService: CredentialsService,
        private cookieService: CookieService,
        private appComponent: AppComponent,
        private demandService: DemandService,
        private categoryService: CategoryService,
        private translate: TranslateService,
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        this.route
            .queryParams
            .subscribe(params => {
                this.redirect = params['redirectURL'];
            });
        if (this.cookieService.get("user_id")) {
            if (this.redirect && this.redirect != "")
                this.appComponent.checkLogin(this.redirect, true);
            else if (!this.appComponent.checkRoles("comp_req") && !this.appComponent.checkRoles('wait_comp'))
                this.appComponent.checkLogin("/user-mgmt/company-registration");
            else
                this.appComponent.checkLogin("/dashboard");
        }
        else {
            setTimeout(function() {
                var input = document.getElementById("email");
                if (input)
                    input.focus();
            }, 100);
        }
        if (this.showLoginFederation) {
            this.federationURL = this.generateFederationURL();
        }
    }

    post(credentials: Credentials): void {
        this.submitCallStatus.submit();
        this.credentialsService.post(credentials)
            .then(res => {
                if (myGlobals.debug)
                    console.log(`User logged in . Response: ${JSON.stringify(res)}`);

                this.response = res;
                this.cookieService.set("user_id", res.userID);
                if (res.companyID)
                    this.cookieService.set("company_id", res.companyID);
                else
                    this.cookieService.set("company_id", null);
                if (res.companyName)
                    this.cookieService.set("active_company_name", selectValueOfTextObject(res.companyName));
                else
                    this.cookieService.set("active_company_name", null);
                if (res.showWelcomeInfo)
                    this.cookieService.set("show_welcome", "true");
                else
                    this.cookieService.set("show_welcome", "false");
                this.cookieService.set("vat", res.vat);
                this.cookieService.set("user_fullname", res.firstname + " " + res.lastname);
                this.cookieService.set("user_email", res.email);
                this.cookieService.set("bearer_token", res.accessToken);
                // get demand last seen response for the user
                if(myGlobals.config.demandsEnabled)
                    this.demandService.getDemandLastSeenResponse();
                // Setting cookie path to root to facilitate the iframe base login
                if (myGlobals.config.showChat) {
                    this.cookieService.set(constants.chatToken, res.rocketChatToken, undefined, '/');
                    this.cookieService.set(constants.chatUsername, res.rocketChatUsername, undefined, '/');
                    this.cookieService.set(constants.chatUserID, res.rocketChatUserID, undefined, '/');
                }

                this.submitCallStatus.callback(this.translate.instant("Login Successful"));
                if (this.redirect && this.redirect != "")
                    this.appComponent.checkLogin(this.redirect, true);
                else if (!res.companyID && myGlobals.config.companyRegistrationRequired)
                    this.appComponent.checkLogin("/user-mgmt/company-registration");
                else
                    this.appComponent.checkLogin("/dashboard");
            })
            .catch(error => {
                this.cookieService.delete("user_id");
                this.cookieService.delete("company_id");
                this.cookieService.delete("user_fullname");
                this.cookieService.delete("user_email");
                this.cookieService.delete("active_company_name");
                this.cookieService.delete("show_welcome");
                this.cookieService.delete("bearer_token");
                this.cookieService.delete(constants.chatToken, '/');
                this.cookieService.delete(constants.chatUsername, '/');
                this.cookieService.delete(constants.chatUserID, '/');
                this.cookieService.delete(constants.chatRCToken, '/');
                this.cookieService.delete(constants.chatRCID, '/');
                this.cookieService.delete(constants.chatRCConnect, '/');
                this.appComponent.checkLogin("");
                this.submitCallStatus.error("Invalid email or password", error);
            });
    }

    reset() {
        this.submitCallStatus.reset();
        this.model = new Credentials('', '');
        this.objToSubmit = new Credentials('', '');
    }

    onSubmit() {
        this.objToSubmit = copy(this.model);
		/*
		this.shaObj = new jsSHA("SHA-256", "TEXT");
		this.shaObj.update(this.model.password);
        this.objToSubmit.password = this.shaObj.getHash("HEX");
		*/
        this.post(this.objToSubmit);
    }

    demoLogin() {
        this.objToSubmit = new Credentials(this.config.demo.account.user, this.config.demo.account.pw);
        this.post(this.objToSubmit);
    }

    generateFederationURL() {
        let identityURL = myGlobals.idpURL + "/protocol/openid-connect/auth";
        let clientID = "?client_id=" + myGlobals.config.federationClientID;
        let redirectURI = "&redirect_uri=" + myGlobals.frontendURL;
        let hint = "&scope=openid&response_type=code&kc_idp_hint=" + myGlobals.config.federationIDP;

        return identityURL + clientID + redirectURI + hint;
    }
}
