import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ng2-cookies';
import { Router } from '@angular/router';

@Component({
	selector: 'nimble-app',
	providers: [ CookieService ],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

	public isLoggedIn = false;
	public isCollapsed = true;
	
	constructor(
		private cookieService: CookieService,
		private router: Router
	) {	}
	
	ngOnInit() {
		/*
		if (this.cookieService.get("user_id"))
			this.router.navigate(["/registration"]); // ToDo: Change to home path
		*/
	}
	
}