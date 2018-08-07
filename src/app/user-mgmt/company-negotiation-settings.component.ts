import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ng2-cookies';
import { UserService } from './user.service';
import { PAYMENT_MEANS, INCOTERMS } from '../catalogue/model/constants';
import { UBLModelUtils } from '../catalogue/model/ubl-model-utils';
import { CallStatus } from '../common/call-status';
import { CompanyNegotiationSettings } from './model/company-negotiation-settings';
import { SelectedTerms } from './selected-terms';
import { copy, deepEquals } from '../common/utils';

@Component({
    selector: 'company-negotiation-settings',
    templateUrl: './company-negotiation-settings.component.html',
    styleUrls: ['./company-negotiation-settings.component.css']
})
export class CompanyNegotiationSettingsComponent implements OnInit {

	PAYMENT_MEANS_LEFT = PAYMENT_MEANS.filter((_, i) => i % 2 === 0);
	PAYMENT_MEANS_RIGHT = PAYMENT_MEANS.filter((_, i) => i % 2 === 1);
	PAYMENT_TERMS = UBLModelUtils.getDefaultPaymentTermsAsStrings();
	PAYMENT_TERMS_LEFT = this.PAYMENT_TERMS.filter((_, i) => i % 2 === 0);
	PAYMENT_TERMS_RIGHT = this.PAYMENT_TERMS.filter((_, i) => i % 2 === 1);
	INCOTERMS_LEFT = INCOTERMS.filter((_, i) => i % 2 === 1);
	INCOTERMS_RIGHT = INCOTERMS.filter((_, i) => i % 2 === 0 && i > 0);

    initCallStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    originalSettings: CompanyNegotiationSettings;
    settings: CompanyNegotiationSettings;
    paymentTerms: SelectedTerms;
    paymentMeans: SelectedTerms;
    incoterms: SelectedTerms;

    constructor(private userService: UserService,
                private cookieService: CookieService) {

    }

    ngOnInit() {
        this.initCallStatus.submit();
        const userId = this.cookieService.get('user_id')
        this.userService.getCompanyNegotiationSettingsForUser(userId)
            .then(settings => {
                this.initCallStatus.callback("Done fetching company negotiation settings", true);

                // selected terms may change the passed terms at initialization
                this.paymentTerms = new SelectedTerms(settings.paymentTerms, this.PAYMENT_TERMS);
                this.paymentMeans = new SelectedTerms(settings.paymentMeans, PAYMENT_MEANS);
                // first incoterm is "" (option for no incoterm)
                this.incoterms = new SelectedTerms(settings.incoterms, INCOTERMS.filter((_, i) => i > 0));

                this.originalSettings = copy(settings);
                this.settings = settings;
            })
            .catch(error => {
                this.initCallStatus.error("Error while fetching company negotiation settings.");
                console.log("Error while fetching company negotiation settings.", error);
            });
    }

    onSave() {
        this.callStatus.submit();
        this.userService.putCompanyNegotiationSettings(this.settings)
            .then(() => {
                this.callStatus.callback("Done saving company negotiation settings", true);
                this.originalSettings = copy(this.settings);
            })
            .catch(error => {
                this.callStatus.error("Error while saving company negotiation settings.");
                console.log("Error while saving company negotiation settings.", error);
            });
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isDirty(): boolean {
        return !deepEquals(this.settings, this.originalSettings);
    }
}
