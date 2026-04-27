import { Component, OnInit, OnDestroy } from '@angular/core';
import { MonitorService, WatchlistEntry, MonitorNotification, ProcessSummary } from './monitor.service';
import { CallStatus } from '../../common/call-status';
import { TranslateService } from '@ngx-translate/core';
import { FEDERATIONID } from '../../catalogue/model/constants';

/**
 * HCDP-04-02: Activity Monitor Component
 *
 * Renders the MONITOR tab in the Dashboard.
 * Two sections:
 *  1. Notifications inbox (persistent, user-dismissed)
 *  2. Watchlist panel with add/remove for BPs and partners
 */
@Component({
    selector: 'monitor-tab',
    templateUrl: './monitor.component.html'
})
export class MonitorComponent implements OnInit, OnDestroy {

    // ---- Loading state
    callStatus: CallStatus = new CallStatus();

    // ---- Notifications
    notifications: MonitorNotification[] = [];
    unreadCount = 0;

    // ---- Watchlist
    watchlist: WatchlistEntry[] = [];
    bpWatchlist: WatchlistEntry[] = [];
    partnerWatchlist: WatchlistEntry[] = [];

    // ---- Add Watch BP modal state
    showAddBpModal = false;
    availableBps: any[] = [];
    selectedBpEntry: any = null;
    bpCustomName = '';
    addBpStatus: CallStatus = new CallStatus();

    // ---- Add Watch Partner modal state
    showAddPartnerModal = false;
    availablePartners: { partyId: string, name: string }[] = [];
    selectedPartnerEntry: { partyId: string, name: string } = null;
    addPartnerStatus: CallStatus = new CallStatus();

    constructor(private monitorService: MonitorService,
                private translateService: TranslateService) {}

    ngOnInit() {
        this.loadAll();
    }

    ngOnDestroy() {}

    /** Federation ID exposed to the template so router links don't hard-code 'staging'. */
    get federationId(): string {
        return FEDERATIONID();
    }

    // ======================================================================
    // LOAD (with lazy detection)
    // ======================================================================
    loadAll() {
        this.callStatus.submit();
        this.monitorService.runDetectionAndGetNotifications()
            .then(notifications => {
                this.notifications = notifications;
                this.unreadCount = notifications.filter(n => !n.readAt).length;
                return this.monitorService.getWatchlist();
            })
            .then(watchlist => {
                this.watchlist = watchlist;
                this.bpWatchlist = watchlist.filter(w => w.watchType === 'BUSINESS_PROCESS');
                this.partnerWatchlist = watchlist.filter(w => w.watchType === 'PARTNER');
                this.callStatus.callback(null, true);
            })
            .catch(err => {
                this.callStatus.error('Error loading monitor data', err);
            });
    }

    // ======================================================================
    // NOTIFICATIONS
    // ======================================================================
    markAllRead() {
        this.monitorService.markAllRead().then(() => {
            this.notifications.forEach(n => { if (!n.readAt) n.readAt = new Date().toISOString(); });
            this.unreadCount = 0;
        });
    }

    clearAll() {
        this.monitorService.clearAll().then(() => {
            this.notifications = [];
            this.unreadCount = 0;
        });
    }

    dismiss(n: MonitorNotification) {
        this.monitorService.dismiss(n.hjid).then(() => {
            this.notifications = this.notifications.filter(x => x.hjid !== n.hjid);
            this.unreadCount = this.notifications.filter(x => !x.readAt).length;
        });
    }

    severityClass(n: MonitorNotification): string {
        if (n.severity === 'CRITICAL') return 'border-danger';
        if (n.severity === 'WARNING') return 'border-warning';
        return 'border-info';
    }

    severityIcon(n: MonitorNotification): string {
        if (n.notificationType === 'DELIVERY_DELAY') return 'fa-truck text-danger';
        if (n.notificationType === 'ANOMALY_DELAY') return 'fa-exclamation-triangle text-danger';
        if (n.notificationType === 'STATUS_CHANGE') return 'fa-exchange-alt text-primary';
        return 'fa-plus-circle text-success';
    }

    isUnread(n: MonitorNotification): boolean {
        return !n.readAt;
    }

    // ======================================================================
    // WATCHLIST — BP
    // ======================================================================
    openAddBpModal() {
        this.showAddBpModal = true;
        this.selectedBpEntry = null;
        this.bpCustomName = '';
        this.addBpStatus = new CallStatus();
        this.monitorService.getMyCollaborationGroups().then(groups => {
            // First pass: build BP rows with the date-based fallback label.
            // Expand each collaboration group into one row PER process instance group (PIG)
            // so that sub-processes (e.g. Fulfilment inside an Order group) are individually watchable.
            const baseRows: any[] = [];
            groups.forEach(cg => {
                const pigs: any[] = (cg.associatedProcessInstanceGroups as any[]) || [];
                pigs.forEach(pig => {
                    const status = pig.status || 'Unknown';
                    const processInstanceId: string = (pig.processInstanceIDs && pig.processInstanceIDs[0]) || null;
                    if (!processInstanceId) return;
                    let fallbackLabel: string;
                    if (pig.firstActivityTime) {
                        const d = new Date(pig.firstActivityTime);
                        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        fallbackLabel = `${this.translateService.instant('Process started')} ${dateStr}`;
                    } else {
                        fallbackLabel = cg.name || `${this.translateService.instant('Process')} #${cg.id}`;
                    }
                    baseRows.push({ label: fallbackLabel, id: cg.id, processInstanceId, status });
                });
            });

            this.availableBps = baseRows;

            // Second pass: enrich labels with backend metadata (BP type + product name + partner)
            // so users see "RFQ for Hydrochar with BioTech" instead of just a date.
            const enrichmentPromises = baseRows.map(bp =>
                this.monitorService.getProcessSummary(bp.processInstanceId).then(summary => {
                    if (!summary) return;
                    const enriched = this.buildEnrichedLabel(summary);
                    if (enriched) bp.label = enriched;
                })
            );
            // Resolve all enrichments in parallel; ignore individual failures (label stays as fallback).
            Promise.all(enrichmentPromises).catch(() => {});
        }).catch(() => { this.availableBps = []; });
    }

    /**
     * Build a human-friendly process label from the backend summary.
     *  - "RFQ for Hydrochar with BioTech"
     *  - "Order for Hydrochar with GreenWaste"
     *  - "Quotation for Hydrochar"  (no partner resolved)
     * Returns null when there's not enough information to improve on the fallback.
     */
    private buildEnrichedLabel(summary: ProcessSummary): string | null {
        const typeKey = this.bpTypeToLabelKey(summary.type);
        const product = summary.products && summary.products.length ? summary.products[0] : null;
        const partner = summary.partner;
        if (!typeKey && !product) return null;

        const typeFrag = typeKey ? this.translateService.instant(typeKey) : '';
        const withFrag = this.translateService.instant('with');
        let label = typeFrag;
        if (product) {
            label = label ? `${label} ${product}` : product;
        }
        if (partner) {
            label = `${label} ${withFrag} ${partner}`;
        }
        return label.trim() || null;
    }

    /** Map BPE document types to the matching i18n key for the label prefix. */
    private bpTypeToLabelKey(bpType: string | undefined): string | null {
        switch (bpType) {
            case 'REQUESTFORQUOTATION': return 'RFQ for';
            case 'QUOTATION':           return 'Quotation for';
            case 'ORDER':               return 'Order for';
            case 'ORDERRESPONSESIMPLE': return 'Order for';
            case 'DESPATCHADVICE':      return 'Fulfilment for';
            case 'RECEIPTADVICE':       return 'Fulfilment for';
            default:                    return null;
        }
    }

    confirmAddBp() {
        if (!this.selectedBpEntry) return;
        this.addBpStatus.submit();
        const label = this.bpCustomName.trim() || this.selectedBpEntry.label;
        this.monitorService.addWatchlistEntry({
            watchType: 'BUSINESS_PROCESS',
            targetId: this.selectedBpEntry.processInstanceId,
            targetLabel: label,
            lastSeenStatus: this.selectedBpEntry.status
        }).then(() => {
            this.addBpStatus.callback(null, true);
            this.showAddBpModal = false;
            this.loadAll();
        }).catch(err => {
            this.addBpStatus.error('Could not add to watchlist', err);
        });
    }

    // ======================================================================
    // WATCHLIST — PARTNER
    // ======================================================================
    openAddPartnerModal() {
        this.showAddPartnerModal = true;
        this.selectedPartnerEntry = null;
        this.addPartnerStatus = new CallStatus();
        this.monitorService.getMyTradingPartners().then(partners => {
            // Filter out already-watched partners
            const watchedIds = new Set(this.partnerWatchlist.map(w => w.targetId));
            this.availablePartners = partners.filter(p => !watchedIds.has(p.partyId));
        }).catch(() => { this.availablePartners = []; });
    }

    confirmAddPartner() {
        if (!this.selectedPartnerEntry) return;
        this.addPartnerStatus.submit();
        this.monitorService.addWatchlistEntry({
            watchType: 'PARTNER',
            targetId: this.selectedPartnerEntry.partyId,
            targetLabel: this.selectedPartnerEntry.name,
            lastSeenBpCount: 0
        }).then(() => {
            this.addPartnerStatus.callback(null, true);
            this.showAddPartnerModal = false;
            this.loadAll();
        }).catch(err => {
            this.addPartnerStatus.error('Could not add partner to watchlist', err);
        });
    }

    // ======================================================================
    // WATCHLIST — REMOVE
    // ======================================================================
    removeWatch(entry: WatchlistEntry) {
        this.monitorService.removeWatchlistEntry(entry.hjid).then(() => {
            this.loadAll();
        });
    }
}
