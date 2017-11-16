import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AddressSubForm } from './subforms/address.component';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { CompanyRegistration } from './model/company-registration';
import { Router } from '@angular/router';
import { AppComponent } from '../app.component';
import * as myGlobals from '../globals';

@Component({
    selector: 'company-registration',
    templateUrl: './company-registration.component.html',
    styleUrls: ['./company-registration.component.css']
})

export class CompanyRegistrationComponent implements OnInit {

    public registrationForm: FormGroup;
    public isSubmitting = false;

    constructor(private _fb: FormBuilder,
				private appComponent: AppComponent,
                private cookieService: CookieService,
                private router: Router,
                private userService: UserService) {
    }

    ngOnInit() {
        this.registrationForm = this._fb.group({
            name: [''],
            address: AddressSubForm.generateForm(this._fb),
        });
    }

    save(model: FormGroup) {


        // create company registration DTO
        let userId = this.cookieService.get('user_id');
		let token = 'Bearer '+this.cookieService.get('bearer_token');
        let companyRegistration: CompanyRegistration = new CompanyRegistration(
            userId, null, model.getRawValue()['name'], model.getRawValue()['address']);

		if (myGlobals.debug)
			console.log(`Registering company ${JSON.stringify(companyRegistration)}`);

        this.isSubmitting = true;
        this.userService.registerCompany(companyRegistration,token)
            .then(response => {
				if (myGlobals.debug)
					console.log(`Saved Company Settings for user ${userId}. Response: ${JSON.stringify(response)}`);

                this.isSubmitting = false;

				this.cookieService.set('bearer_token',response.accessToken);
				
                if( response['companyID'] ) {
                    this.cookieService.set("company_id", response['companyID']);
                    this.cookieService.set("active_company_name", response['name']);
                }

				this.appComponent.checkLogin("");
            })
            .catch(error => {
                console.error('An error occurred', error); // for demo purposes only
                this.isSubmitting = false;
            });

        return false;
    }
}
