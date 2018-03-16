import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AddressSubForm } from './subforms/address.component';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { CompanyRegistration } from './model/company-registration';
import { Router } from '@angular/router';
import { AppComponent } from '../app.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from '../globals';

@Component({
    selector: 'company-registration',
    templateUrl: './company-registration.component.html',
    styleUrls: ['./company-registration.component.css']
})

export class CompanyRegistrationComponent implements OnInit {

    public registrationForm: FormGroup;
    public isSubmitting = false;
	tooltipHTML = "";

    constructor(private _fb: FormBuilder,
				private appComponent: AppComponent,
                private cookieService: CookieService,
				private modalService: NgbModal,
                private router: Router,
                private userService: UserService) {
    }

    ngOnInit() {
        this.registrationForm = this._fb.group({
            name: [''],
			vatNumber: [''],
			verificationInformation: [''],
			website: [''],
            address: AddressSubForm.generateForm(this._fb),
        });
    }

    save(model: FormGroup) {


        // create company registration DTO
        let userId = this.cookieService.get('user_id');
        let companyRegistration: CompanyRegistration = new CompanyRegistration(
            userId, null, model.getRawValue()['name'], model.getRawValue()['vatNumber'], model.getRawValue()['verificationInformation'], model.getRawValue()['website'], model.getRawValue()['address']);

		if (myGlobals.debug)
			console.log(`Registering company ${JSON.stringify(companyRegistration)}`);

        this.isSubmitting = true;
        this.userService.registerCompany(companyRegistration)
            .then(response => {
				if (myGlobals.debug)
					console.log(`Saved Company Settings for user ${userId}. Response: ${JSON.stringify(response)}`);

                this.isSubmitting = false;

				this.cookieService.set('bearer_token',response.accessToken);
				
                if( response['companyID'] ) {
                    this.cookieService.set("company_id", response['companyID']);
                    this.cookieService.set("active_company_name", response['name']);
                }

				this.appComponent.checkLogin("/dashboard");
            })
            .catch(error => {
                console.error('An error occurred', error); // for demo purposes only
                this.isSubmitting = false;
            });

        return false;
    }
	
	showVerificationTT(content) {
		var tooltip = "";
		tooltip += "Please provide links to external resources or any other information that prove your connection to the company you want to register as a legal representative.<br/><br/>";
		tooltip += "e.g. Company member listing on an official website, signing authority, company registration at external authorities, additional identification numbers, ...";
		this.tooltipHTML = tooltip;
		this.modalService.open(content);
	}
	
}
