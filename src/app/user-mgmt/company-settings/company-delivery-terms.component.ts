import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { FormGroup, FormBuilder, FormArray } from "@angular/forms";
import { DeliveryTermsSubForm } from "../subforms/delivery-terms.component";
import * as myGlobals from "../../globals";
import { CallStatus } from "../../common/call-status";
import { CookieService } from "ng2-cookies";
import { UserService } from "../user.service";

@Component({
    selector: "company-delivery-terms",
    templateUrl: "./company-delivery-terms.component.html"
})
export class CompanyDeliveryTermsComponent implements OnInit {

    @Input() settings: CompanySettings;

    settingsForm: FormGroup;

    saveCallStatus: CallStatus = new CallStatus();

    @Output() onSaveEvent: EventEmitter<void> = new EventEmitter();

    constructor(private _fb: FormBuilder,
                private cookieService: CookieService,
                private userService: UserService) {

    }

    ngOnInit() {
        this.settingsForm = this._fb.group({
            deliveryTerms: this._fb.array(
                this.settings.tradeDetails.deliveryTerms.map(term =>
                    DeliveryTermsSubForm.update(
                        DeliveryTermsSubForm.generateForm(this._fb),
                        term
                    )
                )
            )
        });
    }

    onAddDeliveryTerms() {
        const terms = this.getDeliveryTerms();
        terms.push(DeliveryTermsSubForm.generateForm(this._fb));
    }

    onSetToCompanyAddress(index: number) {
        const allTerms = this.getDeliveryTerms();
        const term = allTerms.get([index]);
        DeliveryTermsSubForm.setAddress(term, this.settings.details.address);
        this.settingsForm.markAsDirty();
    }

    onDeleteDeliveryTerms(index: number) {
        const terms = this.getDeliveryTerms();
        terms.removeAt(index);
        this.settingsForm.markAsDirty();
    }

    onSave(model: FormGroup) {
        // update settings
        this.saveCallStatus.submit();
        this.settings.tradeDetails.deliveryTerms = this.generateSpecialTermsMap(model.getRawValue()['deliveryTerms']);
        let userId = this.cookieService.get("user_id");
        this.userService
            .putSettings(this.settings, userId)
            .then(response => {
                if (myGlobals.debug) {
                    console.log(`Saved Company Settings for user ${userId}. Response: ${response}`);
                }
                this.saveCallStatus.callback("Successfully saved", true);
                this.settingsForm.markAsPristine();
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.saveCallStatus.error("Error while saving company settings", error);
            });
    }

    private getDeliveryTerms(): FormArray {
        return this.settingsForm.controls.deliveryTerms as FormArray;
    }

    // this function is used to create languageId-value pairs for SpecialTerms using the raw value of special terms
    private generateSpecialTermsMap(deliveryTermsRawValue){
        for(let delTer of deliveryTermsRawValue){
            let specialTermsMapping = {};
            if(delTer.specialTerms.value != ""){
                specialTermsMapping[delTer.specialTerms.languageID] = delTer.specialTerms.value;
            }
            delTer.specialTerms = specialTermsMapping;
        }
        return deliveryTermsRawValue;
    }
}
