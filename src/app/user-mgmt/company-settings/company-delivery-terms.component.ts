import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { FormGroup, FormBuilder, FormArray } from "@angular/forms";
import { DeliveryTermsSubForm } from "../subforms/delivery-terms.component";
import * as myGlobals from "../../globals";
import { CallStatus } from "../../common/call-status";
import { AddressSubForm } from "../subforms/address.component";
import { CookieService } from "ng2-cookies";
import { UserService } from "../user.service";
import { Address } from "../model/address";

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
            name: [this.settings.name],
            vatNumber: [this.settings.vatNumber],
            verificationInformation: [this.settings.verificationInformation],
            website: [this.settings.website],
            ppapCompatibilityLevel: [this.settings.ppapCompatibilityLevel],
            address: AddressSubForm.update(AddressSubForm.generateForm(this._fb), this.settings.address),
            deliveryTerms: this._fb.array(
                this.settings.deliveryTerms.map(term =>
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

        DeliveryTermsSubForm.setAddress(term, this.settings.address);
    }

    onDeleteDeliveryTerms(index: number) {
        const terms = this.getDeliveryTerms();
        terms.removeAt(index);
    }

    onSave(model: FormGroup) {
        if (myGlobals.debug) {
            console.log(`Changing company ${JSON.stringify(model.getRawValue())}`);
        }

        // update settings
        this.saveCallStatus.submit();
        let userId = this.cookieService.get("user_id");
        this.userService
            .putSettings(model.getRawValue(), userId)
            .then(response => {
                if (myGlobals.debug) {
                    console.log(`Saved Company Settings for user ${userId}. Response: ${response}`);
                }
                this.saveCallStatus.callback("Successfully saved", true);
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.saveCallStatus.error("Error while saving company settings", error);
            });
    }

    private getDeliveryTerms(): FormArray {
        return this.settingsForm.controls.deliveryTerms as FormArray;
    }
}
