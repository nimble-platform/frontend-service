/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

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
        this.userService
            .putSettingsForParty(this.settings, this.settings.companyID)
            .then(response => {
                if (myGlobals.debug) {
                    console.log(`Saved Company Settings for party ${this.settings.companyID}. Response: ${response}`);
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
    private generateSpecialTermsMap(deliveryTermsRawValue) {
        for (let delTer of deliveryTermsRawValue) {
            let specialTermsMapping = {};
            if (delTer.specialTerms.value != "") {
                specialTermsMapping[delTer.specialTerms.languageID] = delTer.specialTerms.value;
            }
            delTer.specialTerms = specialTermsMapping;
        }
        return deliveryTermsRawValue;
    }
}
