import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ng2-cookies';
import { CredentialsService } from './user-mgmt/credentials.service';
import {Router, NavigationStart, NavigationEnd, NavigationCancel, RoutesRecognized, ActivatedRoute} from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from './globals';

@Component({
    selector: 'nimble-app',
    providers: [ CookieService ],
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

	constructor(
		private cookieService: CookieService,
    private credentialsService: CredentialsService,
		private router: Router,
    private route: ActivatedRoute,
		private modalService: NgbModal
	) {
		router.events.subscribe(event => {
			if(event instanceof NavigationStart) {
				this.loading = true;
			}
		});
		router.events.subscribe(event => {
			if(event instanceof NavigationEnd) {
				this.loading = false;
			}
		});
        router.events.subscribe(event => {
            if(event instanceof NavigationCancel) {
                this.loading = false;
            }
        });
		router.events.subscribe(event => {
            if(event instanceof RoutesRecognized) {
                this.checkState(event.url);
            }
        });
	}

	ngOnInit() {
    this.getVersions();
		this.checkLogin("");
    this.route.queryParams.subscribe(params => {
        if (params["externalView"] && params["externalView"]=="frame") {
          this.minimalView = true;
        }
        else {
          this.minimalView = false;
        }
    });
	}

  getVersions(): void {
		this.credentialsService.getVersionIdentity()
		.then(res => {
			if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
				const date_str = new Date(res.git.commit.time).toISOString();
				this.addVersion("identity",`${res.git.branch}-${res.git.commit.id}`,`${date_str}`);
			}
			else {
				this.removeVersion("identity");
			}
		});
		this.credentialsService.getVersionBP()
		.then(res => {
			if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
				const date_str = new Date(res.git.commit.time).toISOString();
				this.addVersion("business-process",`${res.git.branch}-${res.git.commit.id}`,`${date_str}`);
			}
			else {
				this.removeVersion("business-process");
			}
		});
    this.credentialsService.getVersionCatalog()
		.then(res => {
			if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
				const date_str = new Date(res.git.commit.time).toISOString();
				this.addVersion("catalog",`${res.git.branch}-${res.git.commit.id}`,`${date_str}`);
			}
			else {
				this.removeVersion("catalog");
			}
		});
		this.credentialsService.getVersionDataChannel()
		.then(res => {
			if (res.git && res.git.branch && res.git.commit && res.git.commit.time && res.git.commit.id) {
				const date_str = new Date(res.git.commit.time).toISOString();
				this.addVersion("data-channel",`${res.git.branch}-${res.git.commit.id}`,`${date_str}`);
			}
			else {
				this.removeVersion("data-channel");
			}
		});
	}

  public addVersion(id:String, ver:String, date:String) {
    var idx = -1;
    for (var i=0; i<this.versions.length; i++) {
      var id_comp = this.versions[i].id;
      if (id_comp.localeCompare(id) == 0)
        idx = i;
    }
    if (idx >= 0) {
      this.versions.splice(idx,1);
    }
    this.versions.push({
      "id":id,
      "ver":ver,
      "date":date
    });
    this.versions.sort(function(a,b) {
      var a_comp = a.id;
      var b_comp = b.id;
      return a_comp.localeCompare(b_comp);
    })
    this.cookieService.set("versions",JSON.stringify(this.versions));
  }

  public removeVersion(id:String) {
    var idx = -1;
    for (var i=0; i<this.versions.length; i++) {
      var id_comp = this.versions[i].id;
      if (id_comp.localeCompare(id) == 0)
        idx = i;
    }
    if (idx >= 0) {
      this.versions.splice(idx,1);
      this.versions.sort(function(a,b) {
        var a_comp = a.id;
        var b_comp = b.id;
        return a_comp.localeCompare(b_comp);
      })
      this.cookieService.set("versions",JSON.stringify(this.versions));
    }
  }

	public open(content) {
		this.mailto = "mailto:"+this.config.supportMail;
		var subject = "NIMBLE Support Request (UserID: "+this.userID+", Timestamp: "+new Date().toISOString()+")";
		this.mailto += "?subject="+encodeURIComponent(subject);
		var body = "Dear NIMBLE support team,";
		body += "\n\n\n";
		body += "I have encountered an issue.";
		body += "\n\n";
		body += "Path:\n"+window.location.href;
		body += "\n\n";
    body += "Versions:\n";
    for (var i=0; i<this.versions.length; i++) {
      if (i>0) {
        body += " | ";
      }
      body += this.versions[i].id + ": " + this.versions[i].ver;
    }
    body += "\n\n";
		body += "Description of the issue:\n";
		body += "[Please insert a detailed description of the issue here. Add some screenshots as an attachement if they are of use.]";
		body += "\n\n";
		body += "Cause of the issue:\n";
		body += "[Please describe the actions taken that caused the issue here.]";
		body += "\n\n\n";
		body += "Best regards,";
		body += "\n\n";
		body += this.fullName;
		body += "\n";
		body += "(E-Mail: "+this.eMail+", Company: "+this.activeCompanyName+", CompanyID: "+this.companyID+")";
		this.mailto += "&body="+encodeURIComponent(body);
		this.modalService.open(content);
	}

	public checkState(url) {
		if (url) {
			var link = url.split("?")[0];
			if (this.debug)
				console.log("Loading route "+link);
			if (!this.cookieService.get("user_id")) {
				if (link != "/" && link != "/user-mgmt/login" && link != "/user-mgmt/registration" && link != "/analytics/info" && link != "/analytics/members")
					this.router.navigate(["/user-mgmt/login"]);
			}
		}
	}

	public checkLogin(path:any) {
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
					}
					catch(e){}
				}
			}
			else
				this.roles = [];

			// handle active company
			if (this.cookieService.get("company_id") != 'null') {
				this.activeCompanyName = this.cookieService.get("active_company_name");
				this.companyID = this.cookieService.get("company_id");
			}
			else {
				this.activeCompanyName = null;
				this.companyID = null;
			}
		}
		else {
			this.isLoggedIn = false;
			this.fullName = "";
			this.eMail = "";
			this.userID = "";
			this.roles = [];
		}
		if (path != "")
			this.router.navigate([path]);
	}

	public checkRoles(func) {
		this.allowed = false;
		if (this.cookieService.get("company_id") != 'null') {
			this.activeCompanyName = this.cookieService.get("active_company_name");
      this.companyID = this.cookieService.get("company_id");
		}
		else {
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
