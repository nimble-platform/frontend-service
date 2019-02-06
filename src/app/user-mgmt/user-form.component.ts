import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Credentials } from './model/credentials';
import { CredentialsService } from './credentials.service';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import * as myGlobals from '../globals';
import { UserRegistration } from './model/user-registration';
import { ActivatedRoute } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from '@angular/router';
import { CallStatus } from '../common/call-status';
import {selectValueOfTextObject} from '../common/utils';
//declare var jsSHA: any;

@Component({
    selector: 'user-form',
    templateUrl: './user-form.component.html'
})

export class UserFormComponent implements OnInit {

    password_validate = "";
    pw_val_class = "ng-valid";
    passwords_matching = false;
    email_preset = false;
	  eula_accepted = false;
    debug = myGlobals.debug;
    config = myGlobals.config;
    requiredAgreements = {};
    /* ToDo: Hackathon only BEGIN */
    model: UserRegistration = UserRegistration.initEmpty();
    objToSubmit: UserRegistration = UserRegistration.initEmpty();
    /* ToDo: Hackathon only END */
    response: any;
    shaObj: any;

    submitCallStatus: CallStatus = new CallStatus();

    constructor(
        private userService: UserService,
        private router: Router,
		private modalService: NgbModal,
    private credentialsService: CredentialsService,
		private cookieService: CookieService,
		private appComponent: AppComponent,
        public route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        for (var i=0; i<this.config.requiredAgreements.length; i++) {
          this.requiredAgreements[this.config.requiredAgreements[i].title] = false;
        }
        this.route.queryParams.subscribe(params => {
            if (params['email']) {
                const test = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._-]+\.[a-z]{2,3}$/.test(params['email']);
                if (test) {
                    this.model.user.email = params['email'];
                    this.email_preset = true;
                }
                else {
                    this.model.user.email = "";
                    this.email_preset = false;
                }
            }
            else {
                this.model.user.email = "";
                this.email_preset = false;
            }
        });
    }

    post(userRegistration: UserRegistration): void {
        userRegistration.credentials.username = userRegistration.user.email;
        userRegistration.user.username = userRegistration.user.email;
        this.submitCallStatus.submit();
        this.userService.registerUser(userRegistration)
            .then(res => {
                this.response = res;
                this.submitCallStatus.callback("Registration Successful!");
                //this.router.navigate(["/user-mgmt/login"], {queryParams: { pageRef: "registration" }});
                this.login(userRegistration.credentials);
            })
			.catch(error => {
				this.submitCallStatus.error("Registration failed - please make sure your account is not yet registered and try again later", error);
            });
    }

    reset() {
        this.submitCallStatus.reset();
        /* ToDo: Hackathon only BEGIN */
        this.model = UserRegistration.initEmpty();
        this.objToSubmit = UserRegistration.initEmpty();
        //model = new User('','','','','','','','','');
        //objToSubmit = new User('','','','','','','','','');
        /* ToDo: Hackathon only END */
    }

    validatePW() {
        const pw = this.model.credentials.password;
        const pw_val = this.password_validate;
        if (pw.localeCompare(pw_val) == 0) {
            this.passwords_matching = true;
            this.pw_val_class = "ng-valid";
        }
        else {
            this.passwords_matching = false;
            this.pw_val_class = "ng-invalid";
        }
    }

    onSubmit() {
        this.objToSubmit = JSON.parse(JSON.stringify(this.model));
        /*
        this.shaObj = new jsSHA("SHA-256", "TEXT");
        this.shaObj.update(this.model.credentials.password);
        this.objToSubmit.credentials.password = this.shaObj.getHash("HEX");
        */
        // this.objToSubmit.dateOfBirth = new Date(this.model.dateOfBirth).toISOString(); // ToDo: add again to model
        this.post(this.objToSubmit);
    }

    login(credentials: Credentials): void {
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
  			this.appComponent.checkLogin("/user-mgmt/login");
  			this.submitCallStatus.error("Invalid email or password", error);
  		});
  	}

	open(content) {
		this.modalService.open(content);
	}

}
