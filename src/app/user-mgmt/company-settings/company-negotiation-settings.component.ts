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

import { Component, OnInit, Input } from "@angular/core";
import { UserService } from "../user.service";
import {PAYMENT_MEANS, INCOTERMS, PROCESSES} from '../../catalogue/model/constants';
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";
import { CallStatus } from "../../common/call-status";
import { CompanyNegotiationSettings } from "../model/company-negotiation-settings";
import { SelectedTerms } from "../selected-terms";
import { copy, deepEquals } from "../../common/utils";
import { CompanySettings } from "../model/company-settings";
import { CompanySensor } from "../model/company-sensor";
import {BPEService} from '../../bpe/bpe.service';
import * as myGlobals from "../../globals";
import {TranslateService} from '@ngx-translate/core';

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
    PROCESSES = PROCESSES;

    // initCallStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    negotiationSettings: CompanyNegotiationSettings;
    originalSettings: CompanyNegotiationSettings;
    paymentTerms: SelectedTerms;
    paymentMeans: SelectedTerms;
    incoterms: SelectedTerms;
    process_ids: SelectedTerms;

    public SERVICE_TYPES: string[] = ["None", "Service Level 1 (Start/Stop)", "Service Level 2 (Warnings/Alerts)", "Service Level 3 (Machines/Sensors)"]
    newSensor: CompanySensor = new CompanySensor('', '', '');

    // whether the all collaborations is finished or not
    // if all collaborations is finished, then the user can update its workflow
    isAllCollaborationsFinished:boolean;
    alertClosed:boolean = false;

    config = myGlobals.config;

    constructor(private userService: UserService,
                private translate: TranslateService,
                private bpeService: BPEService) {

    }

    ngOnInit() {
        // selected terms may change the passed terms at initialization
        this.negotiationSettings = this.settings.negotiationSettings;
        this.originalSettings = copy(this.negotiationSettings);
        this.paymentTerms = new SelectedTerms(this.negotiationSettings.paymentTerms, this.PAYMENT_TERMS);
        this.paymentMeans = new SelectedTerms(this.negotiationSettings.paymentMeans, PAYMENT_MEANS);
        // first incoterm is "" (option for no incoterm)
        this.incoterms = new SelectedTerms(this.negotiationSettings.incoterms, INCOTERMS);

        let ids = [];
        for(let process of PROCESSES){
            ids.push(process.id);
        }

        if (this.negotiationSettings.company.processID == null || this.negotiationSettings.company.processID.length === 0) {
            this.negotiationSettings.company.processID.push(...ids)
        }
        this.process_ids = new SelectedTerms(this.negotiationSettings.company.processID, ids);
        this.bpeService.checkAllCollaborationsFinished(this.settings.companyID,this.settings.negotiationSettings.company.federationInstanceID).then(finished => {
            this.isAllCollaborationsFinished = finished;
            // no need to show alert
            if(finished){
                this.alertClosed = true;
            }
        });
    }

    onAddSensor() {
        if(typeof this.negotiationSettings.sensors === 'undefined')
        {
            this.negotiationSettings.sensors = [];
        }

        this.negotiationSettings.sensors.push(new CompanySensor(
                                                 this.newSensor.machine,
                                                 this.newSensor.sensor,
                                                 this.newSensor.format));
    }

    onRemoveSensor(sensorID: number) {
        this.negotiationSettings.sensors.splice(sensorID, 1);
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

    atLeastOneProcessSelected(): boolean {
        return this.process_ids.selectedTerms.length > 0;
    }

    isDisabled(): boolean {
        return this.presentationMode === "view";
    }

    // it checks whether we should disable checkbox for the given process id or not
    isProcessIdSelectionDisabled(processId:string){
        // if there exists some unfinished collaborations, do not allow the user to update its workflow
        if(!this.isAllCollaborationsFinished){
            return true;
        }
        // for Negotiation, we should disable checkbox if Order, Transport_Execution_Plan or Fulfilment is selected since Negotiation is a necessary step for these processes
        // and the user should not deselect it.
        if(processId == "Negotiation" && (this.process_ids.isSelected("Order") || this.process_ids.isSelected('Transport_Execution_Plan') || this.process_ids.isSelected('Fulfilment'))){
            return true;
        }
        if(processId == "Order" && this.process_ids.isSelected("Fulfilment")){
            return true;
        }
        return this.isDisabled();
    }

    getSaveButtonError(): string {
        if (!this.atLeastOneProcessSelected()) {
            return this.translate.instant('At least one process should be selected');
        }
        return '';
    }

    isSaveButtonDisabled(): boolean {
        return this.isLoading() || !this.isDirty() || !this.atLeastOneProcessSelected() || this.isDisabled();
    }

    // called when process id checkbox is changed
    // TODO this logic should be mandated by the backend i.e. there must be a structured way of defining relationship between business process types
    onProcessIdToggle(processId:string){
        this.process_ids.toggle(processId);
        // make sure that when Order or Transport_Execution_Plan is selected, Negotiation is selected as well
        if((this.process_ids.isSelected("Order") || this.process_ids.isSelected('Transport_Execution_Plan')) && !this.process_ids.isSelected("Negotiation")){
            this.process_ids.toggle("Negotiation");
        }
        // make sure that when Fulfilment is selected, Negotiation and Order is selected as well
        if(this.process_ids.isSelected("Fulfilment")){
            if(!this.process_ids.isSelected("Negotiation"))
                this.process_ids.toggle("Negotiation");
            if(!this.process_ids.isSelected("Order"))
                this.process_ids.toggle("Order");
        }
    }

}
