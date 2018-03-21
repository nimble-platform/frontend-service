import { Component, OnInit } from '@angular/core';
import { AppComponent } from "../app.component";
import { FormBuilder, FormGroup } from '@angular/forms';
import { DeliveryTermsSubForm } from './subforms/delivery-terms.component';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddressSubForm } from './subforms/address.component';
import { PaymentMeansForm } from './subforms/payment-means.component';
import * as myGlobals from '../globals';

@Component({
    selector: 'company-settings',
    templateUrl: './company-settings.component.html',
    styleUrls: ['./company-settings.component.css']
})

export class CompanySettingsComponent implements OnInit {

	public loading = true;
    public settingsForm: FormGroup;
    public isSubmitting = false;
	public aM = false;
	public mailto = "";
	tooltipHTML = "";

    constructor(private _fb: FormBuilder,
				private appComponent: AppComponent,
                private cookieService: CookieService,
				private modalService: NgbModal,
                private userService: UserService) {
    }

    ngOnInit() {
		this.loading = true;
        this.settingsForm = this._fb.group({
            name: [''],
			vatNumber: [''],
			verificationInformation: [''],
			website: [''],
            address: AddressSubForm.generateForm(this._fb),
            deliveryTerms: DeliveryTermsSubForm.generateForm(this._fb),
            paymentMeans: PaymentMeansForm.generateForm(this._fb)
        });
		this.aM = false;
		AddressSubForm.setDisabled(this.settingsForm.controls['address'],true);
        this.initForm();
    }

    initForm() {

            let userId = this.cookieService.get('user_id');
            this.userService.getSettings(userId).then(settings => {

				if (myGlobals.debug)
					console.log('Fetched settings: ' + JSON.stringify(settings));

                // update forms
                this.settingsForm.controls['name'].setValue(settings.name);
				this.settingsForm.controls['vatNumber'].setValue(settings.vatNumber);
				this.settingsForm.controls['verificationInformation'].setValue(settings.verificationInformation);
				this.settingsForm.controls['website'].setValue(settings.website);
                AddressSubForm.update(this.settingsForm.controls['address'], settings.address);
                PaymentMeansForm.update(this.settingsForm.controls['paymentMeans'], settings.paymentMeans);
                DeliveryTermsSubForm.update(this.settingsForm.controls['deliveryTerms'], settings.deliveryTerms);
				this.checkAddressMatch();
            });
    }
	
	changeData(content) {
		var company_json = AddressSubForm.get(this.settingsForm.controls['address']);
		this.mailto = "mailto:nimble-support@salzburgresearch.at";
		var subject = "NIMBLE Company Data Change Request (UserID: "+this.appComponent.userID+", Timestamp: "+new Date().toISOString()+")";
		this.mailto += "?subject="+encodeURIComponent(subject);
		var body = "Dear NIMBLE support team,";
		body += "\n\n\n";
		body += "I would like to change my company data to the following:";
		body += "\n\n";
		body += "Legal Name:\n";
		body += this.settingsForm.controls['name'].value+"\n\n";
		body += "VAT Number:\n";
		body += this.settingsForm.controls['vatNumber'].value+"\n\n";
		body += "Verification Info:\n";
		body += this.settingsForm.controls['verificationInformation'].value+"\n\n";
		body += "Website:\n";
		body += this.settingsForm.controls['website'].value+"\n\n";
		body += "Street:\n";
		body += company_json.streetName+"\n\n";
		body += "Building Number:\n";
		body += company_json.buildingNumber+"\n\n";
		body += "City:\n";
		body += company_json.cityName+"\n\n";
		body += "Postal Code:\n";
		body += company_json.postalCode+"\n\n";
		body += "Country:\n";
		body += company_json.country;
		body += "\n\n\n";
		body += "Best regards,";
		body += "\n\n";
		body += this.appComponent.fullName;
		body += "\n";
		body += "(E-Mail: "+this.appComponent.eMail+", Company: "+this.appComponent.activeCompanyName+", CompanyID: "+this.appComponent.companyID+")";
		this.mailto += "&body="+encodeURIComponent(body);
		this.modalService.open(content);
	}
	
	changeFlag() {
		if (this.aM) {
			this.copyAddress();
			DeliveryTermsSubForm.setMatch(this.settingsForm.controls['deliveryTerms'],true);
		}
		else {
			DeliveryTermsSubForm.setMatch(this.settingsForm.controls['deliveryTerms'],false);
		}
	}
	
	checkAddressMatch() {
		var delivery_json = DeliveryTermsSubForm.getAddress(this.settingsForm.controls['deliveryTerms']);
		var company_json = AddressSubForm.get(this.settingsForm.controls['address']);
		var delivery_empty = true;
		for (var key in delivery_json) {
			if (delivery_json[key] != "")
				delivery_empty = false;
		}
		if (delivery_empty) {
			this.copyAddress();
			delivery_json = DeliveryTermsSubForm.getAddress(this.settingsForm.controls['deliveryTerms']);
		}
		var address_matching = true;
		for (var key in delivery_json) {
			if (delivery_json[key].localeCompare(company_json[key]) != 0)
				address_matching = false;
		}
		if (address_matching) {
			this.aM = true;
			this.changeFlag();
		}
		else {
			this.aM = false;
			this.changeFlag();
		}
		this.loading = false;
	}
	
	copyAddress() {
		DeliveryTermsSubForm.setSame(this.settingsForm.controls['deliveryTerms'],AddressSubForm.get(this.settingsForm.controls['address']));
	}

    save(model: FormGroup) {

		if (myGlobals.debug)
			console.log(`Changing company ${JSON.stringify(model.getRawValue())}`);

        // update settings
        this.isSubmitting = true;
        let userId = this.cookieService.get('user_id');
        this.userService.putSettings(model.getRawValue(), userId)
            .then(response => {
				if (myGlobals.debug)
					console.log(`Saved Company Settings for user ${userId}. Response: ${response}`);
                this.isSubmitting = false;
				this.ngOnInit();
            })
            .catch(error => {
                console.error('An error occurred', error); // for demo purposes only
                this.isSubmitting = false;
            });
    }
	
	showVerificationTT(content) {
		var tooltip = "";
		tooltip += "Please provide links to external resources or any other information that prove your connection to the company you want to register as a legal representative.<br/><br/>";
		tooltip += "e.g. Company member listing on an official website, signing authority, company registration at external authorities, additional identification numbers, ...";
		this.tooltipHTML = tooltip;
		this.modalService.open(content);
	}
	
}
