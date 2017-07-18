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
	public search = myGlobals.search;
	
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
		}
		if (path != "")
			this.router.navigate([path]);
	}
	
}