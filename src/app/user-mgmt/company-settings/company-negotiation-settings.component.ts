import { Component, OnInit, Input } from "@angular/core";
import { CookieService } from "ng2-cookies";
import { UserService } from "../user.service";
import { PAYMENT_MEANS, INCOTERMS } from "../../catalogue/model/constants";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";
import { CallStatus } from "../../common/call-status";
import { CompanyNegotiationSettings } from "../model/company-negotiation-settings";
import { SelectedTerms } from "../selected-terms";
import { copy, deepEquals } from "../../common/utils";
import { CompanySettings } from "../model/company-settings";

@Component({
    selector: "company-negotiation-settings",
    templateUrl: "./company-negotiation-settings.component.html"
})
export class CompanyNegotiationSettingsComponent implements OnInit {

    @Input() presentationMode: "edit" | "view" = "edit";
    @Input() settings: CompanySettings = null;

    PAYMENT_MEANS_LEFT = PAYMENT_MEANS.filter((_, i) => i % 2 === 0);
    PAYMENT_MEANS_RIGHT = PAYMENT_MEANS.filter((_, i) => i % 2 === 1);
    PAYMENT_TERMS = UBLModelUtils.getDefaultPaymentTermsAsStrings();
    PAYMENT_TERMS_LEFT = this.PAYMENT_TERMS.filter((_, i) => i % 2 === 0);
    PAYMENT_TERMS_RIGHT = this.PAYMENT_TERMS.filter((_, i) => i % 2 === 1);
    INCOTERMS_LEFT = INCOTERMS.filter((_, i) => i % 2 === 1);
    INCOTERMS_RIGHT = INCOTERMS.filter((_, i) => i % 2 === 0 && i > 0);

    // initCallStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    negotiationSettings: CompanyNegotiationSettings;
    originalSettings: CompanyNegotiationSettings;
    paymentTerms: SelectedTerms;
    paymentMeans: SelectedTerms;
    incoterms: SelectedTerms;

    constructor(private userService: UserService) {

    }

    ngOnInit() {
        // selected terms may change the passed terms at initialization
        this.negotiationSettings = this.settings.negotiationSettings;
        this.originalSettings = copy(this.negotiationSettings);
        this.paymentTerms = new SelectedTerms(this.negotiationSettings.paymentTerms, this.PAYMENT_TERMS);
        this.paymentMeans = new SelectedTerms(this.negotiationSettings.paymentMeans, PAYMENT_MEANS);
        // first incoterm is "" (option for no incoterm)
        this.incoterms = new SelectedTerms(this.negotiationSettings.incoterms, INCOTERMS);
    }

    onSave() {
        this.callStatus.submit();
        this.userService
            .putCompanyNegotiationSettings(this.negotiationSettings, this.settings.companyID)
            .then(() => {
                this.callStatus.callback("Done saving company negotiation settings", true);
                this.originalSettings = copy(this.negotiationSettings);
            })
            .catch(error => {
                this.callStatus.error("Error while saving company negotiation settings.", error);
            });
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isDirty(): boolean {
        return !deepEquals(this.negotiationSettings, this.originalSettings);
    }

    isDisabled(): boolean {
        return this.presentationMode === "view";
    }
}
