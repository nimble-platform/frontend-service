import { Component, OnInit } from "@angular/core";
import { ReceiptAdvice } from "../../../catalogue/model/publish/receipt-advice";
import { CallStatus } from "../../../common/call-status";
import { BPEService } from "../../bpe.service";
import { BPDataService } from "../bp-data-service";
import { Router } from "@angular/router";
import { BpUserRole } from "../../model/bp-user-role";
import { Location } from "@angular/common";
import { DespatchAdvice } from "../../../catalogue/model/publish/despatch-advice";
import {CookieService} from 'ng2-cookies';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {TranslateService} from '@ngx-translate/core';
import {quantityToString} from '../../../common/utils';


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

    quantityToString = quantityToString;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private cookieService: CookieService,
                private translate: TranslateService,
                private router:Router) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        this.receiptAdvice = this.bpDataService.receiptAdvice;
        this.dispatchAdvice = this.bpDataService.despatchAdvice;
        this.userRole = this.bpDataService.bpActivityEvent.userRole;
    }

    /*
     * Event Handlers
     */

    onBack(): void {
        this.location.back();
    }

    onSendReceiptAdvice(): void {
        this.callStatus.submit();

        //this.callStatus.submit();
        this.bpeService.startProcessWithDocument(this.bpDataService.receiptAdvice,this.bpDataService.receiptAdvice.despatchSupplierParty.party.federationInstanceID)
            .then(res => {
                this.callStatus.callback("Receipt Advice sent", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            }).catch(error => {
                this.callStatus.error("Failed to send Receipt Advice", error);
            });
    }

    onDispatchOrder(): void{
        this.bpDataService.setCopyDocuments(false, false, false,true);
        this.bpDataService.proceedNextBpStep(this.userRole, "Fulfilment");
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

    isThereADeletedProduct():boolean{
        for(let isProductDeleted of this.processMetadata.areProductsDeleted){
            if(isProductDeleted){
                return true;
            }
        }
        return false;
    }

    isDispatchOrderDisabled(): boolean {
        return this.isLoading() || this.isThereADeletedProduct() || this.processMetadata.isCollaborationFinished;
    }
}
