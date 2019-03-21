import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Credentials } from './model/credentials';
import { CredentialsService } from './credentials.service';
import * as myGlobals from '../globals';
import { CookieService } from 'ng2-cookies';
import { CallStatus } from '../common/call-status';
import {copy, selectValueOfTextObject} from '../common/utils';
import {CategoryService} from '../catalogue/category/category.service';
//declare var jsSHA: any;

@Component({
	selector: 'credentials-form',
	providers: [ CookieService ],
	templateUrl: './credentials-form.component.html'
})

export class CredentialsFormComponent implements OnInit {

	debug = myGlobals.debug;
	pwLink = myGlobals.pw_reset_link;
	model = new Credentials('','');
	objToSubmit = new Credentials('','');
	response: any;
	shaObj: any;

	submitCallStatus: CallStatus = new CallStatus();

	constructor(
		private credentialsService: CredentialsService,
		private cookieService: CookieService,
		private appComponent: AppComponent,
		private categoryService:CategoryService
	) {	}

	ngOnInit() {
		if (this.cookieService.get("user_id")) {
			if (!this.appComponent.checkRoles("comp_req") && !this.appComponent.checkRoles('wait_comp'))
				this.appComponent.checkLogin("/user-mgmt/company-registration");
			else
				this.appComponent.checkLogin("/dashboard");
		}
		else {
			setTimeout(function() {
				var input = document.getElementById("email");
				if (input)
					input.focus();
			},100);
		}
	}

	post(credentials: Credentials): void {
		this.submitCallStatus.submit();
		this.credentialsService.post(credentials)
		.then(res => {
			if (myGlobals.debug)
				console.log(`User logged in . Response: ${JSON.stringify(res)}`);

			this.response = res;
			this.cookieService.set("user_id",res.userID);
			if (res.companyID)
				this.cookieService.set("company_id",res.companyID);
			else
				this.cookieService.set("company_id",null);
			if (res.companyName)
				this.cookieService.set("active_company_name",selectValueOfTextObject(res.companyName));
			else
				this.cookieService.set("active_company_name",null);
			if (res.showWelcomeInfo)
				this.cookieService.set("show_welcome","true");
			else
				this.cookieService.set("show_welcome","false");
			this.cookieService.set("user_fullname",res.firstname+" "+res.lastname);
			this.cookieService.set("user_email",res.email);
			this.cookieService.set("bearer_token",res.accessToken);
			this.submitCallStatus.callback("Login Successful");
			if (!res.companyID && myGlobals.config.companyRegistrationRequired)
				this.appComponent.checkLogin("/user-mgmt/company-registration");
			else
				 this.appComponent.checkLogin("/dashboard");
		})
		.catch(error => {
			this.cookieService.delete("user_id");
			this.cookieService.delete("company_id");
			this.cookieService.delete("user_fullname");
			this.cookieService.delete("user_email");
			this.cookieService.delete("active_company_name");
			this.cookieService.delete("show_welcome");
			this.cookieService.delete("bearer_token");
			this.appComponent.checkLogin("");
			this.submitCallStatus.error("Invalid email or password", error);
		});
	}

	reset() {
		this.submitCallStatus.reset();
		this.model = new Credentials('','');
		this.objToSubmit = new Credentials('','');
	}

	onSubmit() {
		this.objToSubmit = copy(this.model);
		/*
		this.shaObj = new jsSHA("SHA-256", "TEXT");
		this.shaObj.update(this.model.password);
        this.objToSubmit.password = this.shaObj.getHash("HEX");
		*/
		this.post(this.objToSubmit);
	}

}
