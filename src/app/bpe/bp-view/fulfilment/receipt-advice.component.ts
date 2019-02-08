import { Component, OnInit } from "@angular/core";
import { ReceiptAdvice } from "../../../catalogue/model/publish/receipt-advice";
import { CallStatus } from "../../../common/call-status";
import { BPEService } from "../../bpe.service";
import { BPDataService } from "../bp-data-service";
import { Router } from "@angular/router";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { BpUserRole } from "../../model/bp-user-role";
import { Location } from "@angular/common";
import { DespatchAdvice } from "../../../catalogue/model/publish/despatch-advice";
import {CookieService} from 'ng2-cookies';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "receipt-advice",
    templateUrl: "./receipt-advice.component.html",
    styleUrls: ["./receipt-advice.component.css"]
})
export class ReceiptAdviceComponent implements OnInit {

    dispatchAdvice: DespatchAdvice;
    receiptAdvice: ReceiptAdvice;
    userRole: BpUserRole;

    callStatus: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private cookieService: CookieService,
                private router:Router) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        this.receiptAdvice = this.bpDataService.receiptAdvice;
        this.dispatchAdvice = this.bpDataService.despatchAdvice;
        this.userRole = this.bpDataService.bpStartEvent.userRole;
    }

    /*
     * Event Handlers
     */

    onBack(): void {
        this.location.back();
    }

    onSendReceiptAdvice(): void {
        const vars: ProcessVariables = ModelUtils.createProcessVariables(
            "Fulfilment", 
            UBLModelUtils.getPartyId(this.bpDataService.receiptAdvice.despatchSupplierParty.party),
            UBLModelUtils.getPartyId(this.bpDataService.receiptAdvice.deliveryCustomerParty.party),
            this.cookieService.get("user_id"),
            this.bpDataService.receiptAdvice,
            this.bpDataService
        );
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(
            vars, this.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Receipt Advice sent", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            }).catch(error => {
                this.callStatus.error("Failed to send Receipt Advice", error);
            });
    }

    /*
     * Getters & Setters
     */

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return this.userRole === "seller" || this.processMetadata.processStatus == "Completed";
    }
}
