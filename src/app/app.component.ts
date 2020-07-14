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

import {Component, OnInit, ViewChild} from '@angular/core';
import { CookieService } from 'ng2-cookies';
import { CredentialsService } from './user-mgmt/credentials.service';
import {
    Router,
    NavigationStart,
    NavigationEnd,
    NavigationCancel,
    RoutesRecognized,
    ActivatedRoute
} from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from './globals';
import * as moment from "moment";
import { DEFAULT_LANGUAGE, LANGUAGES, FALLBACK_LANGUAGE, FEDERATION } from './catalogue/model/constants';
import { TranslateService } from '@ngx-translate/core';

import 'zone.js';

import { Headers, Http } from "@angular/http";
import { selectValueOfTextObject } from "./common/utils";
import { CallStatus } from "./common/call-status";
import { DomSanitizer } from '@angular/platform-browser';
import {ConfirmModalComponent} from './common/confirm-modal.component';

@Component({
    selector: 'nimble-app',
    providers: [CookieService],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

    public loading = false;
    public isLoggedIn = false;
    public isCollapsed = true;
    // public alertBetaClosed = false;
    public fullName = "";
    public activeCompanyName = null;
    public eMail = "";
    public userID = "";
    public companyID = null;
    public roles = [];
    public debug = myGlobals.debug;
    public config = myGlobals.config;
    public mailto = "";
    public allowed = false;
    public versions = [];
    public minimalView = false;
    public chatVisible = false;
    public chatURL = this.sanitizer.bypassSecurityTrustResourceUrl(myGlobals.rocketChatEndpoint);
    public language = FALLBACK_LANGUAGE;
    private availableLanguages = LANGUAGES.sort();
    private federationStr = FEDERATION();
    public federation = (this.federationStr == "ON");

    enableLogisticServicePublishing = true;

    private accessToken = null;
    response: any;
    submitCallStatus: CallStatus = new CallStatus();

    private translations: any = [];

    @ViewChild(ConfirmModalComponent)
    public confirmModalComponent: ConfirmModalComponent;

    constructor(
        private http: Http,
        private cookieService: CookieService,
        private credentialsService: CredentialsService,
        private router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        public translate: TranslateService,
        public sanitizer: DomSanitizer
    ) {
        router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                this.loading = true;
            }
        });
        router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.loading = false;
            }
        });
        router.events.subscribe(event => {
            if (event instanceof NavigationCancel) {
                this.loading = false;
            }
        });
        router.events.subscribe(event => {
            if (event instanceof RoutesRecognized) {
                this.checkState(event.url);
            }
        });
        if (cookieService.get("federation")) {
            let fS = cookieService.get("federation");
            this.federation = (fS == "ON");
            this.federationStr = fS;
            document.getElementsByTagName('html')[0].setAttribute('data-fed', this.federationStr);
        }
        else {
            this.federation = false;
            this.federationStr = "OFF";
            cookieService.set("federation", this.federationStr);
            document.getElementsByTagName('html')[0].setAttribute('data-fed', this.federationStr);
        }
        if (cookieService.get("language")) {
            this.language = cookieService.get("language");
            document.getElementsByTagName('html')[0].setAttribute('lang', this.language);
        }
        else {
            let langTmp = translate.getBrowserLang();
            if (LANGUAGES.indexOf(langTmp) == -1) {
                langTmp = FALLBACK_LANGUAGE;
            }
            this.language = langTmp;
            cookieService.set("language", this.language);
            document.getElementsByTagName('html')[0].setAttribute('lang', this.language);
        }
        translate.setDefaultLang(FALLBACK_LANGUAGE);
        translate.use(DEFAULT_LANGUAGE());
        this.translate.get(['Chat', 'Federation', 'Language', 'ON', 'OFF']).subscribe((res: any) => {
            this.translations = res;
        });
        if (this.debug)
            console.log("Initialized platform with language: " + DEFAULT_LANGUAGE());
    }

    toggleChat(val) {
        this.chatVisible = val;
    }

    getQueryParameter(name): any {
        let url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));

    }

    setCookiesForFederatedLogin() {
        this.cookieService.set("user_id", this.response.userID);
        if (this.response.companyID)
            this.cookieService.set("company_id", this.response.companyID);
        else
            this.cookieService.set("company_id", null);
        if (this.response.companyName)
            this.cookieService.set("active_company_name", selectValueOfTextObject(this.response.companyName));
        else
            this.cookieService.set("active_company_name", null);
        if (this.response.showWelcomeInfo)
            this.cookieService.set("show_welcome", "true");
        else
            this.cookieService.set("show_welcome", "false");
        this.cookieService.set("vat", this.response.vat);
        this.cookieService.set("user_fullname", this.response.firstname + " " + this.response.lastname);
        this.cookieService.set("user_email", this.response.email);
        this.cookieService.set("bearer_token", this.response.accessToken);
        // this.submitCallStatus.callback("Login Successful");
    }

    generateFederationURL(catalogueId, id) {
        let identityURL = myGlobals.idpURL + "/protocol/openid-connect/auth";
        let clientID = "?client_id=" + myGlobals.config.federationClientID;
        let redirectURI = "&redirect_uri=" + myGlobals.frontendURL;
        let hint = "&scope=openid&response_type=code&kc_idp_hint=" + myGlobals.config.federationIDP;

        if (catalogueId != null && id != null) {
            let endpoint = encodeURI("?catalogueId=" + catalogueId + "_" + id);
            redirectURI = redirectURI + endpoint;
        }

        return identityURL + clientID + redirectURI + hint;
    }

    generateProductURL(catalogueId, id) {
        return myGlobals.frontendURL + "#/product-details?catalogueId=" + catalogueId + "&id=" + id;
    }

    getChatText(): string {
        let txt = this.translations['Chat'];
        if (this.chatVisible)
            txt += ": " + this.translations['ON'];
        else
            txt += ": " + this.translations['OFF'];
        return txt;
    }

    getFederationText(): string {
        let txt = this.translations['Federation'];
        if (this.federation)
            txt += ": " + this.translations['ON'];
        else
            txt += ": " + this.translations['OFF'];
        return txt;
    }

    getLangText(): string {
        let txt = this.translations['Language'];
        txt += ": " + this.language.toUpperCase();
        return txt;
    }

    ngOnInit() {
        // the user could not publish logistic services if the standard taxonomy is 'eClass'
        if (this.config.standardTaxonomy == "eClass") {
            this.enableLogisticServicePublishing = false;
        }

        this.getVersions();
        this.checkLogin("");

        let code = this.getQueryParameter('code');
        let federatedLogin = this.getQueryParameter('federatedLogin');
        let catalogueId = this.getQueryParameter('catalogueId');
        let id = this.getQueryParameter('id');

        if (federatedLogin != undefined && federatedLogin == "efs") {
            window.location.href = this.generateFederationURL(catalogueId, id);
        }

        if (code != null) {

            let redirectURL = window.location.href.split("code=");
            if (redirectURL.length != 1) {
                let lastChar = redirectURL[0].charAt(redirectURL[0].length - 1);
                if (lastChar == '?' || lastChar == '&') {
                    redirectURL[0] = redirectURL[0].substring(0, redirectURL[0].length - 1);
                }
            }

            const url = myGlobals.user_mgmt_endpoint + `/federation/login`;
            this.submitCallStatus.submit();
            return this.http
                .post(url, JSON.stringify({ 'code': code, 'redirect_URL': redirectURL[0] }), { headers: new Headers({ 'Content-Type': 'application/json' }) })
                .toPromise()
                .then(res => {
                    this.submitCallStatus.callback(this.translate.instant("Login Successful"));
                    this.response = res.json();
                    this.setCookiesForFederatedLogin();

                    if (catalogueId != null) {
                        let productDetails = catalogueId.split("_");
                        if (productDetails.length == 2) {
                            catalogueId = productDetails[0];
                            id = productDetails[1];
                        }
                    }

                    if (catalogueId != null && id != null) {
                        window.location.href = this.generateProductURL(catalogueId, id);
                    } else if (!this.response.companyID && myGlobals.config.companyRegistrationRequired) {
                        this.checkLogin("/user-mgmt/company-registration");
                    } else
                        this.checkLogin("/dashboard");

                }).catch((e) => {
                    this.submitCallStatus.error("Login failed", e);
                })
        }

        this.route.queryParams.subscribe(params => {
            if (params["externalView"] && params["externalView"] == "frame") {
                this.minimalView = true;
            } else {
                this.minimalView = false;
            }
        });
    }

    setLang(lang: string) {
        if (lang != this.language) {
            this.loading = true;
            document.getElementsByTagName('html')[0].setAttribute('lang', this.language);
            this.cookieService.set("language", lang);
            location.reload();
        }
    }

    setFed(fed: boolean) {
        if (fed != this.federation) {
            this.loading = true;
            this.federation = fed;
            if (this.federation)
                this.federationStr = "ON";
            else
                this.federationStr = "OFF";
            document.getElementsByTagName('html')[0].setAttribute('data-fed', this.federationStr);
            this.cookieService.set("federation", this.federationStr);
            location.reload();
        }
    }

    getVersions(): void {
        this.credentialsService.getVersionIdentity()
            .then(res => {
                if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
                    const date_str = new Date(res.git.commit.time).toISOString();
                    this.addVersion("identity", `${res.git.branch}-${res.git.commit.id}`, `${date_str}`);
                } else {
                    this.removeVersion("identity");
                }
            })
            .catch(error => { });
        this.credentialsService.getVersionBP()
            .then(res => {
                if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
                    const date_str = new Date(res.git.commit.time).toISOString();
                    this.addVersion("business-process", `${res.git.branch}-${res.git.commit.id}`, `${date_str}`);
                } else {
                    this.removeVersion("business-process");
                }
            })
            .catch(error => { });
        this.credentialsService.getVersionCatalog()
            .then(res => {
                if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
                    const date_str = new Date(res.git.commit.time).toISOString();
                    this.addVersion("catalog", `${res.git.branch}-${res.git.commit.id}`, `${date_str}`);
                } else {
                    this.removeVersion("catalog");
                }
            })
            .catch(error => { });
        /*
        this.credentialsService.getVersionDataChannel()
            .then(res => {
                if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
                    const date_str = new Date(res.git.commit.time).toISOString();
                    this.addVersion("data-channel", `${res.git.branch}-${res.git.commit.id}`, `${date_str}`);
                } else {
                    this.removeVersion("data-channel");
                }
            })
            .catch(error => { });
        */
    }

    public addVersion(id: String, ver: String, date: String) {
        var idx = -1;
        for (var i = 0; i < this.versions.length; i++) {
            var id_comp = this.versions[i].id;
            if (id_comp.localeCompare(id) == 0)
                idx = i;
        }
        if (idx >= 0) {
            this.versions.splice(idx, 1);
        }
        this.versions.push({
            "id": id,
            "ver": ver,
            "date": date
        });
        this.versions.sort(function(a, b) {
            var a_comp = a.id;
            var b_comp = b.id;
            return a_comp.localeCompare(b_comp);
        })
        this.cookieService.set("versions", JSON.stringify(this.versions));
    }

    public removeVersion(id: String) {
        var idx = -1;
        for (var i = 0; i < this.versions.length; i++) {
            var id_comp = this.versions[i].id;
            if (id_comp.localeCompare(id) == 0)
                idx = i;
        }
        if (idx >= 0) {
            this.versions.splice(idx, 1);
            this.versions.sort(function(a, b) {
                var a_comp = a.id;
                var b_comp = b.id;
                return a_comp.localeCompare(b_comp);
            })
            this.cookieService.set("versions", JSON.stringify(this.versions));
        }
    }

    public open(content) {
        this.mailto = "mailto:" + this.config.supportMail;
        var subject = this.translate.instant("Support Request",{platformName:this.config.platformNameInMail}) +"(";
        if (this.userID)
            subject += this.translate.instant("UserID") + ": " + this.userID + ", ";
        if (this.companyID)
            subject += this.translate.instant("CompanyID") + ": " + this.companyID + ", ";
        subject += this.translate.instant("Timestamp") + ": " + new Date().toISOString() + ")";
        this.mailto += "?subject=" + encodeURIComponent(subject);
        var body = "";
        if (this.config.supportMailContent[DEFAULT_LANGUAGE()])
            body += this.config.supportMailContent[DEFAULT_LANGUAGE()];
        else
            body += this.config.supportMailContent["en"];
        body += "\n\n\n";
        body += "-----";
        body += "\n\n";
        body += this.translate.instant("Path") + ":\n" + window.location.href;
        if (this.versions.length > 0) {
            body += "\n\n";
            body += this.translate.instant("Versions") +":\n";
            for (var i = 0; i < this.versions.length; i++) {
                if (i > 0) {
                    body += " | ";
                }
                body += this.versions[i].id + ": " + this.versions[i].ver;
            }
        }
        if (this.userID) {
            body += "\n\n";
            body += this.translate.instant("User") + ":\n" + this.fullName + " ("+this.translate.instant("ID")+": " + this.userID + ", "+this.translate.instant("E-Mail")+": " + this.eMail + ")";
        }
        if (this.companyID) {
            body += "\n\n";
            body += this.translate.instant("Company")+":\n" + this.activeCompanyName + " ("+this.translate.instant("ID")+": " + this.companyID + ")";
        }
        body += "\n";
        this.mailto += "&body=" + encodeURIComponent(body);
        this.modalService.open(content);
    }

    public checkState(url) {
        if (url) {
            var link = url.split("?")[0];
            if (this.debug)
                console.log("Loading route " + link);
            if (!this.cookieService.get("user_id")) {
                if (link != "/" && link != "/user-mgmt/login" && link != "/user-mgmt/registration" && link != "/analytics/info"
                    && link != "/analytics/members" && link != "/user-mgmt/forgot") {
                    this.router.navigate(["/user-mgmt/login"], { queryParams: { redirectURL: url } });
                }
                else {
                    this.logUrl(url);
                }
            }
            else {
                this.logUrl(url);
            }
        }
    }

    public logUrl(url) {
        if (this.config.loggingEnabled) {
            let cID = "";
            if (this.companyID)
                cID = this.companyID;
            let splitHash = url.split("?");
            let hashBase = splitHash[0];
            if (hashBase == "/")
                hashBase = "/user-mgmt/login";
            let params = {};
            if (splitHash.length > 1) {
                let paramArr = splitHash[1].split("&");
                for (let i = 0; i < paramArr.length; i++) {
                    let splitParam = paramArr[i].split("=");
                    let paramName = splitParam[0];
                    let paramValue = splitParam[1];
                    params[paramName] = paramValue;
                }
            }
            let log = {
                "@timestamp": moment().utc().toISOString(),
                "level": "INFO",
                "serviceID": "frontend-service",
                "userId": this.userID,
                "companyId": cID,
                "activity": hashBase,
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

    public checkLogin(path: any, redirected?: boolean) {
        let redUrl = false;
        if (redirected)
            redUrl = redirected;
        if (this.cookieService.get("user_id")) {
            this.isLoggedIn = true;
            /*
            if (this.cookieService.get("versions")) {
              this.versions = JSON.parse(this.cookieService.get("versions"));
            }
            */
            this.fullName = this.cookieService.get("user_fullname");
            this.eMail = this.cookieService.get("user_email");
            this.userID = this.cookieService.get("user_id");
            if (this.cookieService.get('bearer_token')) {
                const at = this.cookieService.get('bearer_token');
                if (at.split(".").length == 3) {
                    const at_payload = at.split(".")[1];
                    try {
                        const at_payload_json = JSON.parse(atob(at_payload));
                        const at_payload_json_roles = at_payload_json["realm_access"]["roles"];
                        this.roles = at_payload_json_roles;
                        if (this.debug)
                            console.log(`Detected roles: ${at_payload_json_roles}`);
                    } catch (e) {
                    }
                }
            } else {
                this.roles = [];
                this.generateDefaultToken();
            }

            // handle active company
            if (this.cookieService.get("company_id") != 'null') {
                this.activeCompanyName = this.cookieService.get("active_company_name");
                this.companyID = this.cookieService.get("company_id");
            } else {
                this.activeCompanyName = null;
                this.companyID = null;
            }
        } else {
            this.isLoggedIn = false;
            this.chatVisible = false;
            this.fullName = "";
            this.eMail = "";
            this.userID = "";
            this.roles = [];
            if (!this.cookieService.get('bearer_token')) {
                this.generateDefaultToken();
            }
        }
        if (path != "") {
            if (!redUrl)
                this.router.navigate([path]);
            else {
                let tmpUrl = decodeURIComponent(path);
                if (tmpUrl.indexOf("?") == -1)
                    this.router.navigate([tmpUrl]);
                else {
                    let tmpPath = tmpUrl.split("?")[0];
                    let tmpParams = tmpUrl.split("?")[1];
                    let tmpParamsSplit = tmpParams.split("&");
                    let tmpParamsObj = { queryParams: {} };
                    for (let i = 0; i < tmpParamsSplit.length; i++) {
                        let key = tmpParamsSplit[i].split("=")[0];
                        let value = tmpParamsSplit[i].split("=")[1];
                        tmpParamsObj.queryParams[key] = value;
                    }
                    this.router.navigate([tmpPath], tmpParamsObj);
                }
            }
        }
    }

    private generateDefaultToken(): void {
        let default_token = "";
        let header = {
            "alg": "RS256",
            "typ": "JWT"
        };
        let payload = {
            "iss": myGlobals.idpURL,
            "aud": "nimble_client",
            "typ": "Bearer",
            "azp": "nimble_client",
            "allowed-origins": [],
            "realm_access": {
                "roles": [
                    "nimble_user"
                ]
            },
            "resource_access": {
                "account": {
                    "roles": []
                }
            },
            "preferred_username": "user@domain.com",
            "email": "user@domain.com"
        };
        let verify = {
            "timestamp": Date.now().toString()
        };
        default_token = [this.encodeToken(header), this.encodeToken(payload), this.encodeToken(verify)].join(".");
        this.cookieService.set("bearer_token", default_token);
    }

    private encodeToken(str: any): string {
        let ret = JSON.stringify(str);
        return btoa(ret);
    }

    private checkAdvMenu(): boolean {
        let ret = false;
        if (this.config.legislationSettings.enabled && this.checkRoles('legislation'))
            ret = true;
        else if (this.config.showExplorative && this.checkRoles('comp_req'))
            ret = true;
        else if (this.config.showTrack && this.checkRoles('track'))
            ret = true;
        return ret;
    }

    private checkCompMenu(): boolean {
        let ret = false;
        if (this.checkRoles('comp') || (this.checkRoles('view_comp') && this.config.showCompanyMembers))
            ret = true;
        else if (this.checkRoles('comp-settings'))
            ret = true;
        else if (this.checkRoles('comp-ratings'))
            ret = true;
        else if (this.config.showAgent && this.checkRoles('bp'))
            ret = true;
        return ret;
    }

    public checkRoles(func) {
        this.allowed = false;
        if (this.cookieService.get("company_id") != 'null') {
            this.activeCompanyName = this.cookieService.get("active_company_name");
            this.companyID = this.cookieService.get("company_id");
        } else {
            this.activeCompanyName = null;
            this.companyID = null;
        }
        const compReq = myGlobals.config.companyRegistrationRequired;
        const admin = this.roles.indexOf("company_admin") != -1;
        const external = this.roles.indexOf("external_representative") != -1;
        const initial = this.roles.indexOf("initial_representative") != -1;
        const legal = this.roles.indexOf("legal_representative") != -1 || this.debug;
        const monitor = this.roles.indexOf("monitor") != -1;
        const publish = this.roles.indexOf("publisher") != -1;
        const purch = this.roles.indexOf("purchaser") != -1;
        const sales = this.roles.indexOf("sales_officer") != -1;
        const manager = this.roles.indexOf("platform_manager") != -1 || this.debug;
        const legislation = this.roles.indexOf("query-legislation") != -1;
        const demo = this.roles.indexOf("demo") != -1;
        const all_rights = admin || external || legal;
        switch (func) {
            case "comp_req":
                if (!compReq || (this.companyID && (legal || !initial)))
                    this.allowed = true;
                break;
            case "reg_comp":
                if (!this.companyID)
                    this.allowed = true;
                break;
            case "wait_comp":
                if (initial && !legal)
                    this.allowed = true;
                break;
            case "sales":
                if (all_rights || sales || monitor)
                    this.allowed = true;
                break;
            case "purchases":
                if (all_rights || purch || monitor)
                    this.allowed = true;
                break;
            case "buy":
                if (all_rights || purch)
                    this.allowed = true;
                break;
            case "catalogue":
                if (all_rights || publish)
                    this.allowed = true;
                break;
            case "favourite":
                if (all_rights || publish || purch || sales || (initial && !compReq))
                    this.allowed = true;
                break;
            case "compare":
                if (all_rights || publish || purch || sales || (initial && !compReq))
                    this.allowed = true;
                break;
            case "projects":
                if (all_rights || purch || sales || monitor || (initial && !compReq))
                    this.allowed = true;
                break;
            case "performance":
                if (all_rights || publish || purch || sales || (initial && !compReq))
                    this.allowed = true;
                break;
            case "bp":
                if (all_rights || purch || sales)
                    this.allowed = true;
                break;
            case "track":
                if (all_rights || sales || purch || monitor)
                    this.allowed = true;
                break;
            case "comp":
                if (all_rights)
                    this.allowed = true;
                break;
            case "view_comp":
                if (this.companyID && !initial)
                    this.allowed = true;
                break;
            case "comp-settings":
                if (all_rights || initial)
                    this.allowed = true;
                break;
            case "comp-ratings":
                if (this.companyID && (legal || !initial))
                    this.allowed = true;
                break;
            case "pm":
                if (manager)
                    this.allowed = true;
                break;
            case "legal":
                if (legal)
                    this.allowed = true;
                break;
            case "collaboration":
                if (all_rights || publish)
                    this.allowed = true;
                break;
            case "legislation":
                if (legislation)
                    this.allowed = true;
                break;
            case "demo":
                if (demo)
                    this.allowed = true;
                break;
            default:
                break;
        }
        return this.allowed;
    }

}
