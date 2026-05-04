/*
 * Copyright 2020
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

import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ng2-cookies';
import { Router } from '@angular/router';
import { BPEService } from '../bpe/bpe.service';
import { CallStatus } from '../common/call-status';
import { BPDataService } from '../bpe/bp-view/bp-data-service';
import { MonitorService, ProcessSummary } from './monitor/monitor.service';
import { FEDERATIONID } from '../catalogue/model/constants';
import { OVERDUE_DAYS_THRESHOLD } from './constants';

/**
 * HCDP-05-02 F3 — Pending Receipts inbox (Buyer dashboard).
 *
 * Counterpart to "Expected Orders" (UnshippedOrdersTabComponent) but for the buyer side:
 * lists collaborations where goods have been dispatched but the buyer has not yet
 * sent a Receipt Advice. Reuses BPE `/monitor/process-summary/{pid}` (same endpoint
 * that powers HCDP-04-02 Activity Monitor + HCDP-05-01 DELIVERY_DELAY detection),
 * so no new backend endpoint is needed.
 */

interface PendingReceiptRow {
    pid: string;
    federationId: string;
    productLabel: string;
    partner: string;
    dispatchedDate: string | null;
    daysSince: number | null;
    overdue: boolean;
}

@Component({
    selector: 'pending-receipts-tab',
    templateUrl: './pending-receipts-tab.component.html',
    styleUrls: ['./pending-receipts-tab.component.css']
})
export class PendingReceiptsTabComponent implements OnInit {

    callStatus: CallStatus = new CallStatus();
    rows: PendingReceiptRow[] = [];

    constructor(private bpeService: BPEService,
        private monitorService: MonitorService,
        private bpDataService: BPDataService,
        private cookieService: CookieService,
        private router: Router) {
    }

    ngOnInit() {
        this.refresh();
    }

    refresh(): void {
        this.callStatus.submit();
        const partyId = this.cookieService.get('company_id');
        const fedId = FEDERATIONID();
        // Buyer-side STARTED process instances only — completed/cancelled ones already
        // settled their receipt (or never will) so they don't belong on a pending list.
        // (BPE's status param maps to ProcessInstanceStatus = STARTED|CANCELLED|COMPLETED.)
        this.bpeService.getCollaborationGroups(partyId, fedId, 'BUYER', 0, 50, false, [], [], [], ['STARTED'])
            .then(async resp => {
                const candidates: { pid: string; federationId: string; partyName: string }[] = [];
                for (const cg of (resp.collaborationGroups || [])) {
                    for (const pig of (cg.associatedProcessInstanceGroups || [])) {
                        if (!pig.processInstanceIDs || pig.processInstanceIDs.length === 0) continue;
                        // Take the latest process instance — that's the one whose status decides
                        // whether the buyer still owes a Receipt Advice.
                        const pid = pig.processInstanceIDs[pig.processInstanceIDs.length - 1];
                        candidates.push({
                            pid,
                            federationId: pig.federationID || fedId,
                            partyName: pig.name || cg.name || ''
                        });
                    }
                }
                // Fetch summaries in parallel; tolerate per-row failures (skip the row).
                const summaries = await Promise.all(
                    candidates.map(c => this.monitorService.getProcessSummary(c.pid).catch(() => null))
                );
                this.rows = candidates
                    .map((c, i) => ({ candidate: c, summary: summaries[i] as ProcessSummary | null }))
                    .filter(r => !!r.summary
                        && !!r.summary.type
                        && r.summary.type.toUpperCase() === 'DESPATCHADVICE'
                        && r.summary.hasReceiptAdvice === false)
                    .map(r => {
                        const days = this.daysSince(r.summary.submissionDate);
                        return {
                            pid: r.candidate.pid,
                            federationId: r.candidate.federationId,
                            productLabel: (r.summary.products && r.summary.products[0]) || r.candidate.partyName || r.candidate.pid,
                            partner: r.summary.partner || '—',
                            dispatchedDate: r.summary.submissionDate || null,
                            daysSince: days,
                            overdue: days !== null && days > OVERDUE_DAYS_THRESHOLD
                        } as PendingReceiptRow;
                    })
                    // Most overdue first, then most recent dispatch.
                    .sort((a, b) => {
                        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
                        return (b.daysSince || 0) - (a.daysSince || 0);
                    });
                this.callStatus.callback('Loaded', true);
            })
            .catch(err => {
                this.callStatus.error('Failed to load pending receptions', err);
            });
    }

    onConfirmReception(row: PendingReceiptRow): void {
        this.bpDataService.viewProcessDetails(row.pid, row.federationId);
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    private daysSince(iso?: string | null): number | null {
        if (!iso) return null;
        const t = new Date(iso).getTime();
        if (isNaN(t)) return null;
        return Math.floor((Date.now() - t) / (24 * 3600 * 1000));
    }
}
