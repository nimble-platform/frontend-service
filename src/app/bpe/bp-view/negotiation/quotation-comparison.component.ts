/*
 * HCDP-02.3: Quotation Comparison Component
 * HCDP-03-02: Extended with Award action for tender bid evaluation
 *
 * WHY THIS COMPONENT EXISTS:
 * When a buyer sends RFQs to multiple suppliers (via shopping cart or individually),
 * each supplier's negotiation thread is stored as a separate ProcessInstanceGroup
 * within a CollaborationGroup. This component fetches the quotation documents from
 * each thread and renders a side-by-side comparison table so the buyer can compare
 * prices, delivery terms, warranty, incoterms, and payment means across suppliers.
 *
 * AWARD FLOW (HCDP-03-02):
 * Clicking "Award" on a row shows an inline confirmation. On confirm, the buyer
 * is navigated directly to that supplier's negotiation detail view to formally
 * accept the quotation. This completes the tender bid evaluation workflow:
 *   Publish Tender → Collect Bids → Compare → Award → Order
 *
 * DATA FLOW:
 * 1. Receives ProcessInstanceGroup[] from parent (collaboration-groups-tab)
 * 2. For each group, gets the last processInstanceId (latest negotiation round)
 * 3. Calls BPEService.getProcessDetailsHistory() → Camunda variable instances
 * 4. Calls DocumentService.getInitialDocument() → full RequestForQuotation JSON
 * 5. Calls DocumentService.getResponseDocument() → full Quotation JSON (or null)
 * 6. Extracts price/delivery/warranty/incoterms from Quotation and renders table
 */

import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProcessInstanceGroup } from '../../model/process-instance-group';
import { BPEService } from '../../bpe.service';
import { DocumentService } from '../document-service';
import { UserService } from '../../../user-mgmt/user.service';
import { CallStatus } from '../../../common/call-status';
import { durationToString } from '../../../common/utils';
import { UBLModelUtils } from '../../../catalogue/model/ubl-model-utils';

interface ComparisonRow {
    supplierName: string;
    productNames: string;
    unitPrice: string;
    quantity: string;
    deliveryPeriod: string;
    warranty: string;
    incoterms: string;
    paymentMeans: string;
    status: string;         // 'Awaiting Response' | 'Accepted' | 'Rejected' | 'Terms Updated' | 'Received'
    notes: string;
    processInstanceId: string;
    federationId: string;
    priceValue: number;     // raw number for sorting/highlighting
    deliveryDays: number;   // raw number for sorting/highlighting
}

@Component({
    selector: 'quotation-comparison',
    templateUrl: './quotation-comparison.component.html'
})
export class QuotationComparisonComponent implements OnInit {

    @Input() collaborationGroupId: string;
    @Input() processInstanceGroups: ProcessInstanceGroup[];

    rows: ComparisonRow[] = [];
    callStatus: CallStatus = new CallStatus();
    bestPriceProcessId: string = '';
    bestDeliveryProcessId: string = '';

    // HCDP-03-02: Award flow state
    // pendingAwardRow: the row awaiting buyer confirmation before navigating
    // awardedProcessId: the row that was awarded (shows checkmark badge)
    pendingAwardRow: ComparisonRow = null;
    awardedProcessId: string = '';

    constructor(
        private bpeService: BPEService,
        private documentService: DocumentService,
        private userService: UserService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadComparisons();
    }

    async loadComparisons() {
        this.callStatus.submit();
        this.rows = [];
        try {
            // Filter to only BUYER-role groups (seller groups are the mirror side)
            const buyerGroups = this.processInstanceGroups.filter(g => g.collaborationRole === 'BUYER');

            const promises = buyerGroups.map(group => this.fetchGroupData(group));
            const results = await Promise.all(promises);

            this.rows = results.filter(r => r !== null);

            // Find best price and best delivery among responded quotations
            const respondedRows = this.rows.filter(r => r.priceValue > 0);
            if (respondedRows.length > 0) {
                const minPrice = Math.min(...respondedRows.map(r => r.priceValue));
                const bestPriceRow = respondedRows.find(r => r.priceValue === minPrice);
                this.bestPriceProcessId = bestPriceRow ? bestPriceRow.processInstanceId : '';

                const deliveredRows = respondedRows.filter(r => r.deliveryDays > 0);
                if (deliveredRows.length > 0) {
                    const minDelivery = Math.min(...deliveredRows.map(r => r.deliveryDays));
                    const bestDeliveryRow = deliveredRows.find(r => r.deliveryDays === minDelivery);
                    this.bestDeliveryProcessId = bestDeliveryRow ? bestDeliveryRow.processInstanceId : '';
                }
            }

            this.callStatus.callback('Loaded comparisons', true);
        } catch (error) {
            this.callStatus.error('Failed to load quotation comparison', error);
        }
    }

    /**
     * Fetches the RFQ and Quotation documents for one supplier's ProcessInstanceGroup.
     *
     * Uses the same data retrieval pattern as thread-summary.component.ts (line 348):
     *   1. getProcessDetailsHistory() → Camunda variable instances
     *   2. getInitialDocument(variables) → extracts "initialDocumentID" → GET /document/json/{id}
     *   3. getResponseDocument(variables) → extracts "responseDocumentID" → GET /document/json/{id}
     */
    private async fetchGroupData(group: ProcessInstanceGroup): Promise<ComparisonRow> {
        try {
            // Get the LAST process instance (latest negotiation round)
            const lastProcessId = group.processInstanceIDs[group.processInstanceIDs.length - 1];

            // Fetch Camunda variable history for this process instance
            // Calls: GET /rest/engine/default/history/variable-instance?processInstanceIdIn={id}
            const activityVariables = await this.bpeService.getProcessDetailsHistory(lastProcessId, group.sellerFederationId);

            // Fetch RFQ document (always exists — it started the process)
            const rfq = await this.documentService.getInitialDocument(activityVariables, group.sellerFederationId);

            // Fetch Quotation document (null if supplier hasn't responded yet)
            const quotation = await this.documentService.getResponseDocument(activityVariables, group.sellerFederationId);

            // Extract product names from RFQ lines
            let productNames = '';
            if (rfq && rfq.requestForQuotationLine) {
                productNames = rfq.requestForQuotationLine
                    .map(line => {
                        const names = line.lineItem.item.name;
                        return names && names.length > 0 ? (names[0].value || 'Unknown') : 'Unknown';
                    })
                    .join(', ');
            }

            // Extract supplier name — prefer party data from quotation/RFQ, fall back to group name
            // Guard: partyName can be [] (empty array) — getPartyDisplayNameForPartyName throws on empty
            let supplierName = group.name || 'Unknown Supplier';
            const qPartyNames = quotation && quotation.sellerSupplierParty && quotation.sellerSupplierParty.party
                ? quotation.sellerSupplierParty.party.partyName : null;
            const rPartyNames = rfq && rfq.sellerSupplierParty && rfq.sellerSupplierParty.party
                ? rfq.sellerSupplierParty.party.partyName : null;
            if (qPartyNames && qPartyNames.length > 0) {
                supplierName = UBLModelUtils.getPartyDisplayNameForPartyName(qPartyNames);
            } else if (rPartyNames && rPartyNames.length > 0) {
                supplierName = UBLModelUtils.getPartyDisplayNameForPartyName(rPartyNames);
            }

            // If no quotation yet, return a "waiting" row
            if (!quotation) {
                return {
                    supplierName: supplierName,
                    productNames: productNames,
                    unitPrice: '-',
                    quantity: '-',
                    deliveryPeriod: '-',
                    warranty: '-',
                    incoterms: '-',
                    paymentMeans: '-',
                    status: 'Awaiting Response',
                    notes: '',
                    processInstanceId: lastProcessId,
                    federationId: group.sellerFederationId,
                    priceValue: 0,
                    deliveryDays: 0
                };
            }

            // Extract quotation data from the first quotation line
            // (multi-line quotations show first line; full details via "View Details" button)
            const qLine = quotation.quotationLine[0];
            const lineItem = qLine.lineItem;

            // Price
            const priceAmount = lineItem.price.priceAmount;
            const priceValue = priceAmount.value || 0;
            const currency = priceAmount.currencyID || 'EUR';
            const unitPrice = priceValue > 0 ? `${priceValue} ${currency}` : '-';

            // Quantity
            const qty = lineItem.quantity;
            const quantity = qty && qty.value ? `${qty.value} ${qty.unitCode || ''}` : '-';

            // Delivery period — uses durationToString() from common/utils
            // (same utility used by QuotationWrapper.deliveryPeriodString getter)
            let deliveryPeriod = '-';
            let deliveryDays = 0;
            try {
                if (lineItem.delivery && lineItem.delivery.length > 0) {
                    const dm = lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
                    deliveryPeriod = durationToString(dm);
                    deliveryDays = dm.value || 0;
                    // Normalize to days for comparison
                    if (dm.unitCode === 'week(s)') { deliveryDays *= 7; }
                    else if (dm.unitCode === 'month(s)') { deliveryDays *= 30; }
                    else if (dm.unitCode === 'year(s)') { deliveryDays *= 365; }
                }
            } catch (e) { /* delivery info might be incomplete */ }

            // Warranty
            let warranty = '-';
            try {
                if (lineItem.warrantyValidityPeriod && lineItem.warrantyValidityPeriod.durationMeasure) {
                    warranty = durationToString(lineItem.warrantyValidityPeriod.durationMeasure);
                }
            } catch (e) { /* warranty might be empty */ }

            // Incoterms
            const incoterms = lineItem.deliveryTerms && lineItem.deliveryTerms.incoterms
                ? lineItem.deliveryTerms.incoterms : '-';

            // Payment means
            let paymentMeans = '-';
            try {
                if (lineItem.paymentMeans && lineItem.paymentMeans.paymentMeansCode) {
                    paymentMeans = lineItem.paymentMeans.paymentMeansCode.value || '-';
                }
            } catch (e) { /* payment might be empty */ }

            // Status — from quotation.documentStatusCode
            // NB: Nimble stores the status in documentStatusCode.name (not .value which may be empty)
            let status = 'Received';
            if (quotation.documentStatusCode) {
                status = quotation.documentStatusCode.value || quotation.documentStatusCode.name || 'Received';
            }

            // Supplier notes
            let notes = '';
            if (quotation.note && quotation.note.length > 0) {
                notes = quotation.note.join('; ');
            }

            return {
                supplierName, productNames, unitPrice, quantity,
                deliveryPeriod, warranty, incoterms, paymentMeans,
                status, notes,
                processInstanceId: lastProcessId,
                federationId: group.sellerFederationId,
                priceValue, deliveryDays
            };
        } catch (error) {
            console.warn('Failed to fetch comparison data for group', group.id, error);
            return null;
        }
    }

    viewDetails(row: ComparisonRow) {
        // Navigate to the existing negotiation detail view
        // Same route used by thread-summary.component when clicking a thread event
        this.router.navigate(['/bpe/bpe-exec', row.processInstanceId, row.federationId]);
    }

    // ── HCDP-03-02: Award actions ────────────────────────────────────

    /** Step 1: buyer clicks Award — show inline confirmation on that row */
    onAwardClicked(row: ComparisonRow) {
        this.pendingAwardRow = row;
    }

    /** Step 2a: buyer confirms → mark as awarded and navigate to negotiation detail */
    onAwardConfirmed() {
        if (!this.pendingAwardRow) { return; }
        this.awardedProcessId = this.pendingAwardRow.processInstanceId;
        const row = this.pendingAwardRow;
        this.pendingAwardRow = null;
        // Navigate to the negotiation detail where the buyer formally accepts the quotation
        this.router.navigate(['/bpe/bpe-exec', row.processInstanceId, row.federationId]);
    }

    /** Step 2b: buyer cancels — dismiss confirmation */
    onAwardCancelled() {
        this.pendingAwardRow = null;
    }

    isAwarded(row: ComparisonRow): boolean {
        return row.processInstanceId === this.awardedProcessId;
    }

    isPendingAward(row: ComparisonRow): boolean {
        return this.pendingAwardRow !== null
            && this.pendingAwardRow.processInstanceId === row.processInstanceId;
    }

    /** Award is only available for rows that have actually responded */
    canAward(row: ComparisonRow): boolean {
        return row.status !== 'Awaiting Response' && row.status !== 'Rejected';
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'Accepted': return 'badge-success';
            case 'Rejected': return 'badge-danger';
            case 'Terms Updated': return 'badge-info';
            case 'Awaiting Response': return 'badge-warning';
            default: return 'badge-secondary';
        }
    }

    get bestPriceSupplier(): string {
        const row = this.rows.find(r => r.processInstanceId === this.bestPriceProcessId);
        return row ? row.supplierName : '';
    }

    get bestDeliverySupplier(): string {
        const row = this.rows.find(r => r.processInstanceId === this.bestDeliveryProcessId);
        return row ? row.supplierName : '';
    }

    isBestPrice(row: ComparisonRow): boolean {
        return row.processInstanceId === this.bestPriceProcessId && row.priceValue > 0;
    }

    isBestDelivery(row: ComparisonRow): boolean {
        return row.processInstanceId === this.bestDeliveryProcessId && row.deliveryDays > 0;
    }

    refresh() {
        this.loadComparisons();
    }
}
