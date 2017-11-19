import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ng2-cookies';
import { Router } from '@angular/router';
import * as myGlobals from './globals';

@Component({
	selector: 'nimble-app',
	providers: [ CookieService ],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

	public isLoggedIn = false;
	public isCollapsed = true;
	public fullName = "";
	public activeCompanyName = null;
	public eMail = "";
	public roles = [];
	
	constructor(
		private cookieService: CookieService,
		private router: Router
	) {	}
	
	ngOnInit() {
		this.checkLogin("");
	}
	
	public checkLogin(path:any) {
		if (this.cookieService.get("user_id")) {
			this.isLoggedIn = true;
			this.fullName = this.cookieService.get("user_fullname");
			this.eMail = this.cookieService.get("user_email");
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
			this.roles = [];
		}
		if (path != "")
			this.router.navigate([path]);
	}
	
}