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
import { CookieService } from 'ng2-cookies';
import { ThreadEventMetadata } from '../../../catalogue/model/publish/thread-event-metadata';
import { quantityToString } from '../../../common/utils';
import { Quantity } from '../../../catalogue/model/publish/quantity';

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

    // HCDP-05-01 F3 / HCDP-05-02 F1 — Structured reject reason (tag-prefixed into rejectReason[0] string).
    // Selection is per-line so multi-line POs can carry independent issue categories.
    readonly reasonCodes = ['DAMAGED', 'QUANTITY_MISMATCH', 'LATE', 'QUALITY_ISSUE', 'OTHER'];
    selectedReasonCodes: string[] = [];

    // HCDP-05-02 F2 — UI helper mirroring rejectedQuantity. Canonical UBL field stays
    // receiptLine[i].rejectedQuantity; acceptedQuantities is never serialized.
    // Invariant: acceptedQuantities[i].value + receiptLine[i].rejectedQuantity.value
    //          = dispatchAdvice.despatchLine[i].deliveredQuantity.value
    acceptedQuantities: Quantity[] = [];

    constructor(private bpeService: BPEService,
        private bpDataService: BPDataService,
        private location: Location,
        private cookieService: CookieService,
        private router: Router) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        this.receiptAdvice = this.bpDataService.receiptAdvice;
        this.dispatchAdvice = this.bpDataService.despatchAdvice;
        this.userRole = this.bpDataService.bpActivityEvent.userRole;

        // HCDP-05-02 F1 — hydrate per-line dropdown state from saved [CODE] tags
        // HCDP-05-02 F2 — hydrate accepted-qty UI helper as `delivered − rejected` (clamped >= 0)
        if (this.receiptAdvice && this.receiptAdvice.receiptLine) {
            this.receiptAdvice.receiptLine.forEach((line, i) => {
                // F1 hydration
                const existing = line.rejectReason && line.rejectReason[0];
                let code = '';
                if (existing) {
                    const m = existing.match(/^\[([A-Z_]+)\]/);
                    if (m && this.reasonCodes.indexOf(m[1]) >= 0) {
                        code = m[1];
                    }
                }
                this.selectedReasonCodes[i] = code;

                // F2 hydration
                const delivered = this.getDeliveredValue(i);
                const rejected = (line.rejectedQuantity && line.rejectedQuantity.value) || 0;
                const accepted = Math.max(0, delivered - rejected);
                const unit = (line.rejectedQuantity && line.rejectedQuantity.unitCode) || null;
                this.acceptedQuantities[i] = new Quantity(accepted, unit);
            });
        }
    }

    /**
     * HCDP-05-02 F1 — re-applies the selected [CODE] tag to receiptLine[i].rejectReason[0],
     * stripping any prior tag.
     */
    onReasonCodeChange(i: number): void {
        if (!this.receiptAdvice || !this.receiptAdvice.receiptLine || !this.receiptAdvice.receiptLine[i]) return;
        const line = this.receiptAdvice.receiptLine[i];
        if (!line.rejectReason || line.rejectReason.length === 0) {
            line.rejectReason = [''];
        }
        const stripped = (line.rejectReason[0] || '').replace(/^\[[A-Z_]+\]\s*/, '');
        const code = this.selectedReasonCodes[i] || '';
        line.rejectReason[0] = code ? `[${code}] ${stripped}` : stripped;
    }

    /**
     * HCDP-05-02 F2 — when user edits accepted: rejected = delivered − accepted (clamp 0..delivered).
     * UI input only — UBL document carries rejectedQuantity exclusively.
     */
    onAcceptedChange(i: number): void {
        const delivered = this.getDeliveredValue(i);
        const accepted = this.clamp((this.acceptedQuantities[i] && this.acceptedQuantities[i].value) || 0, 0, delivered);
        this.acceptedQuantities[i].value = accepted;
        if (this.receiptAdvice.receiptLine[i].rejectedQuantity) {
            this.receiptAdvice.receiptLine[i].rejectedQuantity.value = delivered - accepted;
        }
    }

    /**
     * HCDP-05-02 F2 — when user edits rejected: accepted = delivered − rejected (clamp 0..delivered).
     */
    onRejectedChange(i: number): void {
        const delivered = this.getDeliveredValue(i);
        const rq = this.receiptAdvice.receiptLine[i].rejectedQuantity;
        if (!rq) return;
        rq.value = this.clamp(rq.value || 0, 0, delivered);
        if (!this.acceptedQuantities[i]) {
            this.acceptedQuantities[i] = new Quantity(0, rq.unitCode || null);
        }
        this.acceptedQuantities[i].value = delivered - rq.value;
    }

    private getDeliveredValue(i: number): number {
        const line = this.dispatchAdvice && this.dispatchAdvice.despatchLine && this.dispatchAdvice.despatchLine[i];
        return (line && line.deliveredQuantity && line.deliveredQuantity.value) || 0;
    }

    /**
     * Guards rendering of `<shipment-input>` — its template crashes when
     * carrierParty/partyName is null (existing bug; we simply hide the panel
     * when the data isn't safe). Used in receipt-advice.component.html.
     */
    hasShipmentToShow(): boolean {
        const da = this.dispatchAdvice;
        if (!da || !da.despatchLine || !da.despatchLine[0]) return false;
        const ship = da.despatchLine[0].shipment;
        if (!ship || !ship[0]) return false;
        const stage = ship[0].shipmentStage;
        if (!stage || !stage[0]) return false;
        const cp = stage[0].carrierParty;
        if (!cp || !cp.partyName || !cp.partyName[0]) return false;
        return true;
    }

    private clamp(value: number, min: number, max: number): number {
        if (value < min) return min;
        if (value > max) return max;
        return value;
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
        this.bpeService.startProcessWithDocument(this.bpDataService.receiptAdvice, this.bpDataService.receiptAdvice.despatchSupplierParty.party.federationInstanceID)
            .then(res => {
                this.callStatus.callback("Receipt Advice sent", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                    tab = "SALES";
                this.router.navigate(['dashboard'], { queryParams: { tab: tab, ins: this.bpDataService.receiptAdvice.despatchSupplierParty.party.federationInstanceID } });
            }).catch(error => {
                this.callStatus.error("Failed to send Receipt Advice", error);
            });
    }

    onDispatchOrder(): void {
        this.bpDataService.setCopyDocuments(false, false, false, true);
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

    isThereADeletedProduct(): boolean {
        for (let isProductDeleted of this.processMetadata.areProductsDeleted) {
            if (isProductDeleted) {
                return true;
            }
        }
        return false;
    }

    isDispatchOrderDisabled(): boolean {
        return this.isLoading() || this.isThereADeletedProduct() || this.processMetadata.collaborationStatus == "COMPLETED" || this.processMetadata.collaborationStatus == "CANCELLED";
    }
}
