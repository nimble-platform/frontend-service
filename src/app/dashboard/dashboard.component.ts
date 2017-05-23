import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CookieService } from 'ng2-cookies';

@Component({
	selector: 'nimble-dashboard',
	providers: [ CookieService ],
	templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit {

	fullName = "";

	constructor(
		private cookieService: CookieService,
		private appComponent: AppComponent
	) {	}
	
	ngOnInit() {
		if (this.cookieService.get("user_fullname"))
			this.fullName = this.cookieService.get("user_fullname");
		if (this.cookieService.get("user_id")) {}
		else
			this.appComponent.checkLogin("/login");
	}

}