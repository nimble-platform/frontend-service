import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ng2-cookies';
import {Router, NavigationStart, NavigationEnd, NavigationCancel, RoutesRecognized} from '@angular/router';
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
	public companyID = "";
	public roles = [];
	public debug = myGlobals.debug;
	public mailto = "";
	public allowed = false;

	constructor(
		private cookieService: CookieService,
		private router: Router,
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
		this.checkLogin("");
	}

	public open(content) {
		this.mailto = "mailto:nimble-support@salzburgresearch.at";
		var subject = "NIMBLE Support Request (UserID: "+this.userID+", Timestamp: "+new Date().toISOString()+")";
		this.mailto += "?subject="+encodeURIComponent(subject);
		var body = "Dear NIMBLE support team,";
		body += "\n\n\n";
		body += "I have encountered an issue.";
		body += "\n\n";
		body += "Path:\n"+window.location.href;
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
				if (link != "/" && link != "/user-mgmt/login" && link != "/user-mgmt/registration")
					this.router.navigate(["/user-mgmt/login"]);
			}
		}
	}
	
	public checkLogin(path:any) {
		if (this.cookieService.get("user_id")) {
			this.isLoggedIn = true;
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
		}
		else {
			this.activeCompanyName = null;
		}
		const admin = this.roles.indexOf("company_admin") != -1;
		const external = this.roles.indexOf("external_representative") != -1;
		const initial = this.roles.indexOf("initial_representative") != -1;
		const legal = this.roles.indexOf("legal_representative") != -1 || this.debug;
		const monitor = this.roles.indexOf("monitor") != -1;
		const publish = this.roles.indexOf("publisher") != -1;
		const purch = this.roles.indexOf("purchaser") != -1;
		const sales = this.roles.indexOf("sales_offices") != -1;
		const all_rights = admin || external || legal;
		switch (func) {
			case "reg_comp":
				if (!this.activeCompanyName)
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
				if (all_rights || publish || initial)
					this.allowed = true;
				break;
			case "bp":
				if (all_rights || purch || sales)
					this.allowed = true;
				break;
			case "comp":
				if (all_rights)
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
