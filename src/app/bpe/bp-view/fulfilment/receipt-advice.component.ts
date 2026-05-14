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
// HCDP-05-04 — Replace Logistics Provider feature
import {
    LogisticsProvider,
    CANCELLATION_WINDOW_DAYS,
    CARRIER_CHANGE_DOC_TYPE,
    CarrierChangeRecord,
} from './logistics-providers';
import { DocumentReference } from '../../../catalogue/model/publish/document-reference';
import { Attachment } from '../../../catalogue/model/publish/attachment';
import { BinaryObject } from '../../../catalogue/model/publish/binary-object';
import { UBLModelUtils } from '../../../catalogue/model/ubl-model-utils';
import { MonitorService } from '../../../dashboard/monitor/monitor.service';
import { ReplaceProviderResult } from './replace-provider-modal.component';

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

    // HCDP-05-04 F1 / F2 — Replace Provider modal state
    showReplaceProviderModal = false;
    replacementSubmitting = false;
    readonly cancellationWindowDays = CANCELLATION_WINDOW_DAYS;

    constructor(private bpeService: BPEService,
        private bpDataService: BPDataService,
        private location: Location,
        private cookieService: CookieService,
        private router: Router,
        private monitorService: MonitorService) {
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

    // ---- HCDP-05-04 — Replace Logistics Provider helpers ------------------

    /** Reads the currently-set carrier name from the dispatch advice. Defensive
     *  null-guards mirror hasShipmentToShow() so this never crashes. */
    currentCarrierName(): string | null {
        const da = this.dispatchAdvice;
        if (!da || !da.despatchLine || !da.despatchLine[0]) return null;
        const ship = da.despatchLine[0].shipment;
        if (!ship || !ship[0]) return null;
        const stage = ship[0].shipmentStage;
        if (!stage || !stage[0]) return null;
        const cp = stage[0].carrierParty;
        if (!cp || !cp.partyName || !cp.partyName[0]) return null;
        const n = cp.partyName[0].name;
        return (n && n.value) || null;
    }

    /** F1 visibility — buyer side, fulfilment in flight, dispatchAdvice exists. */
    canReplaceProvider(): boolean {
        if (this.userRole !== 'buyer') return false;
        if (!this.hasShipmentToShow()) return false;
        if (!this.processMetadata) return false;
        if (this.processMetadata.processStatus === 'Completed') return false;
        if (this.processMetadata.collaborationStatus === 'CANCELLED') return false;
        if (!this.dispatchAdvice || !this.dispatchAdvice.id) return false;
        return true;
    }

    /** F1 enable rule — within CANCELLATION_WINDOW_DAYS of dispatch. */
    isWithinCancellationWindow(): boolean {
        const dispatchedAtIso = this.processMetadata && (this.processMetadata as any).startTime;
        if (!dispatchedAtIso) return false;
        const t = new Date(dispatchedAtIso).getTime();
        if (isNaN(t)) return false;
        const days = (Date.now() - t) / (24 * 3600 * 1000);
        return days <= CANCELLATION_WINDOW_DAYS;
    }

    openReplaceProviderModal(): void {
        if (!this.canReplaceProvider() || !this.isWithinCancellationWindow()) return;
        this.showReplaceProviderModal = true;
    }

    onReplaceProviderCancel(): void {
        if (this.replacementSubmitting) return;
        this.showReplaceProviderModal = false;
    }

    onReplaceProviderConfirm(result: ReplaceProviderResult): void {
        if (!result || !result.newProvider) return;
        this.replacementSubmitting = true;
        this.callStatus.submit();
        this.executeReplacement(result.newProvider, result.reason)
            .then(() => {
                this.replacementSubmitting = false;
                this.showReplaceProviderModal = false;
                this.callStatus.callback("Carrier replaced", true);
            })
            .catch(err => {
                this.replacementSubmitting = false;
                this.callStatus.error("Failed to replace carrier", err);
            });
    }

    /** F4 — atomic carrier replacement: mutate UBL carrier fields, append a
     *  CARRIER_CHANGE audit reference, PATCH the DespatchAdvice via BPE, then
     *  fire F6 audit-log notification (best-effort). */
    private async executeReplacement(newProvider: LogisticsProvider, reason: string | null): Promise<void> {
        const oldName = this.currentCarrierName() || '—';
        const newName = newProvider.name;

        // 1. Mutate shipmentStage carrierParty across ALL despatch lines
        if (this.dispatchAdvice.despatchLine) {
            for (const line of this.dispatchAdvice.despatchLine) {
                if (!line.shipment) continue;
                for (const ship of line.shipment) {
                    if (!ship.shipmentStage) continue;
                    for (const stage of ship.shipmentStage) {
                        if (stage.carrierParty
                            && stage.carrierParty.partyName
                            && stage.carrierParty.partyName[0]
                            && stage.carrierParty.partyName[0].name) {
                            stage.carrierParty.partyName[0].name.value = newName;
                        }
                    }
                }
            }
        }

        // 2. Sync transportServiceProviderParty (top-level) when present
        const tsp = (this.dispatchAdvice as any).transportServiceProviderParty;
        if (tsp && tsp.partyName && tsp.partyName[0] && tsp.partyName[0].name) {
            tsp.partyName[0].name.value = newName;
        }

        // 3. Append CARRIER_CHANGE audit reference (JSON blob in a BinaryObject)
        const record: CarrierChangeRecord = {
            oldProvider: oldName,
            newProvider: newName,
            timestamp: new Date().toISOString(),
            reason: reason,
            actor: this.cookieService.get('user_email') || 'unknown',
        };
        const json = JSON.stringify(record, null, 2);
        // utf-8 safe base64 (handles non-ASCII reason text)
        const base64 = btoa(unescape(encodeURIComponent(json)));
        // fileName encodes old/new/timestamp so the timeline annotation can
        // reconstruct after a backend round-trip — BPE moves BinaryObject.value
        // to external content storage on PATCH (uri = "BusinessProcessBinaryContentUri:...")
        // and returns value=null, but fileName is preserved verbatim.
        const millis = new Date(record.timestamp).getTime();
        const fileName = `carrier-change-${millis}-FROM-${encodeURIComponent(oldName)}-TO-${encodeURIComponent(newName)}.json`;
        const binary = new BinaryObject(base64, 'application/json', fileName, null, null);
        const attachment = new Attachment(binary);
        const ref = new DocumentReference(UBLModelUtils.generateUUID(), CARRIER_CHANGE_DOC_TYPE, attachment);
        if (!this.dispatchAdvice.additionalDocumentReference) {
            this.dispatchAdvice.additionalDocumentReference = [];
        }
        this.dispatchAdvice.additionalDocumentReference.push(ref);

        // 4. PATCH the updated DespatchAdvice (Approach A — see spec §2.3)
        await this.bpeService.updateDocument(
            this.dispatchAdvice.id,
            this.dispatchAdvice,
            'DESPATCHADVICE',
        );

        // 5. F6 — buyer-side audit-log entry (best-effort; never blocks)
        this.fireCarrierChangedAuditLog(oldName, newName, reason).catch(err =>
            console.warn('CARRIER_CHANGED audit-log notification failed:', err)
        );
    }

    /** F6 — Records the replacement as an audit-log entry in the buyer's own
     *  Activity Monitor inbox. Cross-party seller notification is deferred
     *  (MonitorService is user-scoped — see spec §3.6). */
    private fireCarrierChangedAuditLog(oldName: string, newName: string, reason: string | null): Promise<any> {
        const pid = this.processMetadata && (this.processMetadata as any).processInstanceId;
        return this.monitorService.createNotification({
            notificationType: 'CARRIER_CHANGED' as any,
            severity: 'INFO',
            title: `Carrier replaced: ${oldName} → ${newName}`,
            message: reason ? `Reason: ${reason}` : null,
            relatedProcessId: pid || null,
        });
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
