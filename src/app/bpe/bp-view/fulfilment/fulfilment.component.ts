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

import { Component, Input, OnInit } from '@angular/core';
import { BPDataService } from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { CallStatus } from '../../../common/call-status';
import { BPEService } from '../../bpe.service';
import { DespatchLine } from '../../../catalogue/model/publish/despatch-line';

@Component({
    selector: "fulfilment",
    templateUrl: "./fulfilment.component.html",
    styleUrls: ["./fulfilment.component.css"]
})
export class FulfilmentComponent implements OnInit {

    line: CatalogueLine;
    // hjids of the line items included in the order
    orderLineItemHjids: string[] = null;
    // order line index of the selected product
    _selectedOrderLineIndex: number = 0;

    @Input() catalogueLines: CatalogueLine[] = [];

    constructor(private bpDataService: BPDataService,
        private bpeService: BPEService) {

    }

    totalDispatched: number[] = [];
    totalAccepted: number[] = [];
    totalToBeShipped: number[] = [];
    totalWaitingResponse: number[] = [];
    totalRejected: number[] = [];
    // HCDP-05-02 F5 — per-line nonconformity flag (1 if rejectedQuantity > 0, else 0)
    totalNonconformities: number[] = [];

    fulfilmentStatisticsCallStatus: CallStatus = new CallStatus();

    // HCDP-05-01 F1 — Delivery Timeline threshold: fulfilments with a despatch older
    // than this and no receipt are rendered as "Overdue" on the In-Transit node.
    static readonly OVERDUE_DAYS_THRESHOLD = 5;

    ngOnInit() {
        this.line = this.bpDataService.getCatalogueLine();

        this.initializeFulfilmentStatisticsSection();
    }

    // ---- HCDP-05-01 F1 — Delivery Timeline state + helpers --------------------

    get hasDespatch(): boolean {
        return !!this.bpDataService.despatchAdvice && !!this.bpDataService.despatchAdvice.id;
    }

    get hasReceipt(): boolean {
        // True only when the ReceiptAdvice has been fully submitted (processStatus = Completed).
        // showReceiptAdvice() is intentionally NOT used here: it returns true even when the
        // buyer is just opening the form (bpDataService.receiptAdvice is pre-initialized as
        // an empty object), which would incorrectly mark all timeline nodes as Delivered.
        const pm = this.bpDataService.bpActivityEvent && this.bpDataService.bpActivityEvent.processMetadata;
        return !!(pm && pm.processStatus === 'Completed');
    }

    get timelineState(): 'ORDER' | 'DISPATCHED' | 'IN_TRANSIT_ONTIME' | 'IN_TRANSIT_OVERDUE' | 'DELIVERED' {
        if (this.hasReceipt) return 'DELIVERED';
        if (!this.hasDespatch) return 'ORDER';
        const days = this.daysSinceDispatch;
        if (days !== null && days > FulfilmentComponent.OVERDUE_DAYS_THRESHOLD) return 'IN_TRANSIT_OVERDUE';
        return 'IN_TRANSIT_ONTIME';
    }

    /** Process start time of the fulfilment BP — doubles as the despatch timestamp for display. */
    get dispatchTimestamp(): string | null {
        const pm = this.bpDataService.bpActivityEvent && this.bpDataService.bpActivityEvent.processMetadata;
        return (pm && pm.startTime) ? pm.startTime : null;
    }

    get daysSinceDispatch(): number | null {
        if (!this.dispatchTimestamp) return null;
        const t = new Date(this.dispatchTimestamp).getTime();
        if (isNaN(t)) return null;
        return Math.floor((Date.now() - t) / (24 * 3600 * 1000));
    }

    /**
     * Reads `[CODE]` tag prefix that HCDP-05-01 F3 writes into `rejectReason[0]`. Null when not tagged.
     * HCDP-05-02 F1 companion — scans ALL receipt lines (not just line 0) so multi-line
     * nonconformities still surface on the timeline badge. Returns the first matching code
     * found; degenerate single-line case still returns the same value as before.
     */
    get rejectReasonBadge(): string | null {
        const ra = this.bpDataService.receiptAdvice;
        if (!ra || !ra.receiptLine) return null;
        for (const line of ra.receiptLine) {
            const reason = line.rejectReason && line.rejectReason[0];
            if (!reason) continue;
            const m = reason.match(/^\[([A-Z_]+)\]/);
            if (m) return m[1];
        }
        return null;
    }

    /** Reads handlingInstructions free-text carrier name seeded by TEP → initDispatchAdvice. */
    get carrierLabel(): string | null {
        const da = this.bpDataService.despatchAdvice;
        const shipment = da && da.despatchLine && da.despatchLine[0] && da.despatchLine[0].shipment && da.despatchLine[0].shipment[0];
        if (!shipment) return null;
        // TEP-seeded carrier is stored in handlingInstructions or shipmentStage metadata; degrade gracefully.
        const hi = shipment.handlingInstructions && shipment.handlingInstructions[0];
        if (hi && hi.value) return hi.value;
        return null;
    }

    showReceiptAdvice(): boolean {
        let isResponseSent = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.processStatus == 'Completed';
        let isCollaborationCancelled = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.collaborationStatus == "CANCELLED";
        return isResponseSent || (!!this.bpDataService.receiptAdvice && !isCollaborationCancelled);
    }

    private initializeFulfilmentStatisticsSection(): void {
        let orderId;
        let sellerFederationId;
        if (this.bpDataService.despatchAdvice) {
            orderId = this.bpDataService.despatchAdvice.orderReference[0].documentReference.id;
            sellerFederationId = this.bpDataService.despatchAdvice.despatchSupplierParty.party.federationInstanceID;
        }
        // starting a new Despatch Advice following a Transport Execution Plan
        else if (this.bpDataService.productOrder) {
            orderId = this.bpDataService.productOrder.id;
            sellerFederationId = this.bpDataService.productOrder.sellerSupplierParty.party.federationInstanceID;
        }
        // starting a new Despatch Advice following an Order
        else if (this.bpDataService.copyOrder) {
            orderId = this.bpDataService.copyOrder.id;
            sellerFederationId = this.bpDataService.copyOrder.sellerSupplierParty.party.federationInstanceID;
        }
        this.fulfilmentStatisticsCallStatus.submit();
        this.bpeService.getFulfilmentStatistics(orderId, sellerFederationId).then(result => {
            this.orderLineItemHjids = [];
            for (let statistics of result) {
                this.orderLineItemHjids.push(statistics.lineItemHjid.toString());
                let totalDispatched = statistics.dispatchedQuantity;
                let totalAccepted = statistics.acceptedQuantity;
                let totalRejected = statistics.rejectedQuantity;
                let waitingResponse = totalDispatched - totalAccepted - totalRejected;
                let toBeShipped = statistics.requestedQuantity - totalAccepted - waitingResponse;

                this.totalDispatched.push(totalDispatched);
                this.totalAccepted.push(totalAccepted);
                this.totalRejected.push(totalRejected);
                this.totalToBeShipped.push(toBeShipped > 0 ? toBeShipped : 0);
                this.totalWaitingResponse.push(waitingResponse);
                // HCDP-05-02 F5 — per-line nonconformity flag (1 if anything rejected on this line, else 0).
                // TODO: replace with statistics.nonconformityCount when BPE exposes it natively.
                this.totalNonconformities.push(totalRejected > 0 ? 1 : 0);
            }

            this._selectedOrderLineIndex = this.getOrderLineIndex(0);

            this.fulfilmentStatisticsCallStatus.callback(null, true);
        }).catch(error => {
            this.fulfilmentStatisticsCallStatus.error("Failed to get fulfilment statistics", error);
        });
    }

    isLoading(): boolean {
        return this.fulfilmentStatisticsCallStatus.fb_submitted;
    }

    @Input()
    set selectedLineIndex(index: number) {
        this._selectedOrderLineIndex = this.getOrderLineIndex(index);
    }

    private getOrderLineIndex(index: number): number {
        let orderLineIndex: number = index;
        if (this.bpDataService.despatchAdvice && this.orderLineItemHjids) {
            let dispatchAdviceLine: DespatchLine = this.bpDataService.despatchAdvice.despatchLine[index];
            // In TEP view,we show all products included in the order at the top,however, TEP itself can contain a subset of these products as goods items,
            // therefore, we may not have a dispatch line for the given index.
            // in this case, we can simply return the given index, because it corresponds to the correct order line index
            if (dispatchAdviceLine) {
                let size = this.orderLineItemHjids.length;
                for (let i = 0; i < size; i++) {
                    if (this.orderLineItemHjids[i] == dispatchAdviceLine.orderLineReference.lineID) {
                        orderLineIndex = i;
                        break;
                    }
                }
            }
        }
        return orderLineIndex;
    }
}
