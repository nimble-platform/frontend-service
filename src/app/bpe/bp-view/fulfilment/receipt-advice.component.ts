/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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
                this.router.navigate(['dashboard'], {queryParams: {tab: tab, ins: this.bpDataService.receiptAdvice.despatchSupplierParty.party.federationInstanceID}});
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
        return this.isLoading() || this.isThereADeletedProduct() || this.processMetadata.collaborationStatus == "COMPLETED" || this.processMetadata.collaborationStatus == "CANCELLED";
    }
}
