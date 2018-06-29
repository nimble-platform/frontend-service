import { Component, OnInit } from "@angular/core";
import { BPEService } from "../../bpe.service";
import { ProcessVariables } from "../../model/process-variables";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { ModelUtils } from "../../model/model-utils";
import { BPDataService } from "../bp-data-service";
import { DespatchAdvice } from "../../../catalogue/model/publish/despatch-advice";
import { CallStatus } from "../../../common/call-status";
import { Router } from "@angular/router";
import { copy } from "../../../common/utils";
import { Location } from "@angular/common";

@Component({
    selector: 'dispatch-advice',
    templateUrl: './dispatch-advice.component.html'
})
export class DispatchAdviceComponent implements OnInit {

    dispatchAdvice: DespatchAdvice;

	callStatus: CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private router: Router) {
    }

    ngOnInit() {
        this.dispatchAdvice = this.bpDataService.despatchAdvice;
    }

    /*
     * Event Handlers
     */

    onBack(): void {
        this.location.back();
    }

    onSendDispatchAdvice(): void {
        let dispatchAdvice: DespatchAdvice = copy(this.bpDataService.despatchAdvice);
        UBLModelUtils.removeHjidFieldsFromObject(dispatchAdvice);

        let vars: ProcessVariables = ModelUtils.createProcessVariables(
            "Fulfilment", 
            dispatchAdvice.despatchSupplierParty.party.id, 
            dispatchAdvice.deliveryCustomerParty.party.id, 
            dispatchAdvice, 
            this.bpDataService
        );
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

        this.callStatus.submit();
        this.bpeService.startBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Dispatch Advice sent", true);
                this.router.navigate(['dashboard']);
            })
            .catch(error => {
                this.callStatus.error("Failed to send Dispatch Advice");
                console.log("Failed to send Dispatch Advice", error);
            });
    }

    /*
     * Getters & Setters
     */

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return !!this.bpDataService.processMetadata;
    }
}