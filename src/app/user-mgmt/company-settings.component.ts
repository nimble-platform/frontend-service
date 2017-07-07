import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DeliveryTermsSubForm } from './subforms/delivery-terms.component';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { AddressSubForm } from './subforms/address.component';
import { PaymentMeansForm } from './subforms/payment-means.component';

@Component({
    selector: 'company-settings',
    templateUrl: './company-settings.component.html',
    styleUrls: ['./company-settings.component.css']
})

export class CompanySettingsComponent implements OnInit {

    public settingsForm: FormGroup;
    public isSubmitting = false;

    constructor(private _fb: FormBuilder,
                private cookieService: CookieService,
                private userService: UserService) {
    }

    ngOnInit() {
        this.settingsForm = this._fb.group({
            address: AddressSubForm.generateForm(this._fb),
            deliveryTerms: DeliveryTermsSubForm.generateForm(this._fb),
            paymentMeans: PaymentMeansForm.generateForm(this._fb),
        });

        this.initForm();
    }

    initForm() {
        let userId = this.cookieService.get('user_id');
        this.userService.getSettings(userId).then(settings => {

            console.log('Fetched settings: ' + JSON.stringify(settings));

            // update forms
            AddressSubForm.update(this.settingsForm.controls['address'], settings.address);
            PaymentMeansForm.update(this.settingsForm.controls['paymentMeans'], settings.paymentMeans);
            DeliveryTermsSubForm.update(this.settingsForm.controls['deliveryTerms'], settings.deliveryTerms);
        });
    }

    save(model: FormGroup) {

        console.log(JSON.stringify(model.getRawValue()));

        // save settings
        this.isSubmitting = true;
        let userId = this.cookieService.get('user_id');
        this.userService.putSettings(model.getRawValue(), userId)
            .then(response => {
                console.log(`Saved Company Settings for user ${userId}. Response: ${response}`);
                this.isSubmitting = false;
            })
            .catch(error => {
                console.error('An error occurred', error); // for demo purposes only
                this.isSubmitting = false;
            });
    }
}