import {Component, OnInit} from '@angular/core';
import {CookieService} from 'ng2-cookies';
import {CredentialsService} from './user-mgmt/credentials.service';
import {
    Router,
    NavigationStart,
    NavigationEnd,
    NavigationCancel,
    RoutesRecognized,
    ActivatedRoute
} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from './globals';
import * as moment from "moment";
import {DEFAULT_LANGUAGE} from './catalogue/model/constants';

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

    enableLogisticServicePublishing = true;

    constructor(
        private cookieService: CookieService,
        private credentialsService: CredentialsService,
        private router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal
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
    }

    ngOnInit() {
        // the user could not publish logistic services if the standard taxonomy is 'eClass'
        if(this.config.standardTaxonomy == "eClass"){
            this.enableLogisticServicePublishing = false;
        }

        this.getVersions();
        this.checkLogin("");
        this.route.queryParams.subscribe(params => {
            if (params["externalView"] && params["externalView"] == "frame") {
                this.minimalView = true;
            } else {
                this.minimalView = false;
            }
        });
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
            .catch(error => {});
        this.credentialsService.getVersionBP()
            .then(res => {
                if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
                    const date_str = new Date(res.git.commit.time).toISOString();
                    this.addVersion("business-process", `${res.git.branch}-${res.git.commit.id}`, `${date_str}`);
                } else {
                    this.removeVersion("business-process");
                }
            })
            .catch(error => {});
        this.credentialsService.getVersionCatalog()
            .then(res => {
                if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
                    const date_str = new Date(res.git.commit.time).toISOString();
                    this.addVersion("catalog", `${res.git.branch}-${res.git.commit.id}`, `${date_str}`);
                } else {
                    this.removeVersion("catalog");
                }
            })
            .catch(error => {});
        this.credentialsService.getVersionDataChannel()
            .then(res => {
                if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
                    const date_str = new Date(res.git.commit.time).toISOString();
                    this.addVersion("data-channel", `${res.git.branch}-${res.git.commit.id}`, `${date_str}`);
                } else {
                    this.removeVersion("data-channel");
                }
            })
            .catch(error => {});
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
        this.versions.sort(function (a, b) {
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
            this.versions.sort(function (a, b) {
                var a_comp = a.id;
                var b_comp = b.id;
                return a_comp.localeCompare(b_comp);
            })
            this.cookieService.set("versions", JSON.stringify(this.versions));
        }
    }

    public open(content) {
        this.mailto = "mailto:" + this.config.supportMail;
        var subject = "NIMBLE Support Request (";
        if (this.userID)
            subject += "UserID: " + this.userID + ", ";
        if (this.companyID)
            subject += "CompanyID: " + this.companyID + ", ";
        subject += "Timestamp: " + new Date().toISOString() + ")";
        this.mailto += "?subject=" + encodeURIComponent(subject);
        var body = "";
        if (this.config.supportMailContent[DEFAULT_LANGUAGE()])
            body += this.config.supportMailContent[DEFAULT_LANGUAGE()];
        else
            body += this.config.supportMailContent["en"];
        body += "\n\n\n";
        body += "-----";
        body += "\n\n";
        body += "Path:\n" + window.location.href;
        if (this.versions.length > 0) {
            body += "\n\n";
            body += "Versions:\n";
            for (var i = 0; i < this.versions.length; i++) {
                if (i > 0) {
                    body += " | ";
                }
                body += this.versions[i].id + ": " + this.versions[i].ver;
            }
        }
        if (this.userID) {
            body += "\n\n";
            body += "User:\n" + this.fullName + " (ID: " + this.userID + ", E-Mail: " + this.eMail + ")";
        }
        if (this.companyID) {
            body += "\n\n";
            body += "Company:\n" + this.activeCompanyName + " (ID: " + this.companyID + ")";
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
                    this.router.navigate(["/user-mgmt/login"], {queryParams: {redirectURL: url}});
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
          for (let i=0; i<paramArr.length; i++) {
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
          console.log("Writing log "+JSON.stringify(log));
        this.credentialsService.logUrl(log)
          .then(res => {})
          .catch(error => {});
      }
    }

    public checkLogin(path: any,redirected?:boolean) {
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
            } else
                this.roles = [];

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
            this.fullName = "";
            this.eMail = "";
            this.userID = "";
            this.roles = [];
        }
        if (path != "") {
          if(!redUrl)
            this.router.navigate([path]);
          else {
            let tmpUrl = decodeURIComponent(path);
            if (tmpUrl.indexOf("?") == -1)
              this.router.navigate([tmpUrl]);
            else {
              let tmpPath = tmpUrl.split("?")[0];
              let tmpParams = tmpUrl.split("?")[1];
              let tmpParamsSplit = tmpParams.split("&");
              let tmpParamsObj = { queryParams : {} };
              for (let i=0; i<tmpParamsSplit.length; i++) {
                let key = tmpParamsSplit[i].split("=")[0];
                let value = tmpParamsSplit[i].split("=")[1];
                tmpParamsObj.queryParams[key] = value;
              }
              this.router.navigate([tmpPath],tmpParamsObj);
            }
          }
        }
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
            case "catalogue":
                if (all_rights || publish || (initial && !compReq))
                    this.allowed = true;
                break;
            case "favourite":
                if (all_rights || publish || purch || sales || (initial && !compReq))
                    this.allowed = true;
                break;
            case "compare" :
                if (all_rights || publish || purch || sales || (initial && !compReq))
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
            default:
                break;
        }
        return this.allowed;
    }

}
