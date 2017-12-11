import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ng2-cookies';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
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
	public fullName = "";
	public activeCompanyName = null;
	public eMail = "";
	public userID = "";
	public roles = [];
	public debug = myGlobals.debug;
	public mailto = "";
	
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
	}
	
	ngOnInit() {
		this.checkLogin("");
	}
	
	public open(content) {
		this.mailto = "mailto:nimble-support@salzburgresearch.at";
		var subject = "NIMBLE Support Request";
		this.mailto += "?subject="+encodeURIComponent(subject);
		var body = "Dear NIMBLE support team,";
		body += "\n\n\n";
		body += "I have encountered an issue.";
		body += "\n\n";
		body += "Timestamp:\n"+new Date().toISOString();
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
		body += "(E-Mail: "+this.eMail+", UserID: "+this.userID+", Company: "+this.activeCompanyName+")";
		this.mailto += "&body="+encodeURIComponent(body);
		this.modalService.open(content);
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
						if (myGlobals.debug)
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
			}
			else {
				this.activeCompanyName = null;
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
	
}