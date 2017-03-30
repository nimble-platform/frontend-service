import { Component } from '@angular/core';
import { Credentials } from './credentials';
import { CredentialsService } from './credentials.service';
import * as myGlobals from './globals';
import { CookieService } from 'ng2-cookies';
import { Router } from '@angular/router';
declare var jsSHA: any;

@Component({
	selector: 'credentials-form',
	providers: [ CookieService ],
	templateUrl: './credentials-form.component.html'
})

export class CredentialsFormComponent {

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
		private cookieService: CookieService
	) {	}

	post(credentials: Credentials): void {
		this.credentialsService.post(credentials)
		.then(res => {
			this.response = res;
			this.cookieService.set("user_id",res.userID);
			this.cookieService.set("user_fullname",res.firstname+" "+res.lastname);
			this.callback = true;
			this.error_detc = false;
		})
		.catch(error => {
			this.error_detc = true;
		});
	}
	
	reset() {
		this.cookieService.delete("username");
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