import { Component, OnInit } from '@angular/core';
import { AppComponent } from './app.component';
import { CookieService } from 'ng2-cookies';

@Component({
	selector: 'nimble-logout',
	providers: [ CookieService ],
	templateUrl: './logout.component.html'
})

export class LogoutComponent implements OnInit {

	constructor(
		private cookieService: CookieService,
		private appComponent: AppComponent
	) {	}

	ngOnInit() {
		this.cookieService.delete("user_id");
		this.cookieService.delete("user_fullname");
		this.cookieService.delete("user_email");
		this.appComponent.checkLogin("/login");
	}

}