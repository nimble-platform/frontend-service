import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Credentials } from './model/credentials';
import { CredentialsService } from './credentials.service';
import * as myGlobals from '../globals';
import { CookieService } from 'ng2-cookies';
declare var jsSHA: any;

@Component({
	selector: 'credentials-form',
	providers: [ CookieService ],
	templateUrl: './credentials-form.component.html'
})

export class CredentialsFormComponent implements OnInit {

	submitted = false;
	callback = false;
	error_detc = false;
	debug = myGlobals.debug;
	model = new Credentials('','');
	objToSubmit = new Credentials('','');
	response: any;
	shaObj: any;

	constructor(
		private credentialsService: CredentialsService,
		private cookieService: CookieService,
		private appComponent: AppComponent
	) {	}
	
	ngOnInit() {
		if (this.cookieService.get("user_id"))
			this.appComponent.checkLogin("/dashboard");
	}

	post(credentials: Credentials): void {
		this.credentialsService.post(credentials)
		.then(res => {

			console.log(`User logged in . Response: ${JSON.stringify(res)}`);

			this.response = res;
			this.cookieService.set("user_id",res.userID);
			this.cookieService.set("company_id",res.companyID);
			this.cookieService.set("active_company_name",res.companyName);
			this.cookieService.set("user_fullname",res.firstname+" "+res.lastname);
			this.cookieService.set("user_email",res.email);
			this.cookieService.set("bearer_token",res.accessToken);
			this.callback = true;
			this.error_detc = false;
			this.appComponent.checkLogin("/dashboard");
		})
		.catch(error => {
			this.cookieService.delete("user_id");
			this.cookieService.delete("company_id");
			this.cookieService.delete("user_fullname");
			this.cookieService.delete("user_email");
			this.cookieService.delete("active_company_name");
			this.cookieService.delete("bearer_token");
			this.appComponent.checkLogin("");
			this.error_detc = true;
		});
	}
	
	reset() {
		this.submitted = false;
		this.callback = false;
		this.error_detc = false;
		this.model = new Credentials('','');
		this.objToSubmit = new Credentials('','');
	}
	
	onSubmit() {
		this.objToSubmit = JSON.parse(JSON.stringify(this.model));
		this.shaObj = new jsSHA("SHA-256", "TEXT");
		this.shaObj.update(this.model.password);
        this.objToSubmit.password = this.shaObj.getHash("HEX");
		this.submitted = true;
		this.post(this.objToSubmit);
	}
	
}