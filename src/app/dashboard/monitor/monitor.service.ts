import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ng2-cookies';
import { TranslateService } from '@ngx-translate/core';
import { catalogue_endpoint, bpe_endpoint } from '../../globals';
import { FEDERATIONID } from '../../catalogue/model/constants';

/**
 * HCDP-04-02: Activity Monitor Service
 *
 * Handles watchlist CRUD (backed by catalog-service) and lazy state-change detection
 * (calls BPE directly with user's bearer token, then persists notifications to catalog-service).
 *
 * Architecture: no cron job, no catalog-service → BPE dependency.
 * Detection runs in Angular when the MONITOR tab is opened or badge-count is polled.
 */

export interface WatchlistEntry {
    hjid?: number;
    userId: string;
    watchType: 'BUSINESS_PROCESS' | 'PARTNER';
    targetId: string;
    targetLabel: string;
    lastSeenStatus?: string;
    lastSeenBpCount?: number;
    lastAnomalyAlerted?: boolean;
    createdAt?: string;
}

export interface MonitorNotification {
    hjid?: number;
    userId: string;
    watchlistEntryHjid?: number;
    notificationType: 'STATUS_CHANGE' | 'NEW_PROCESS' | 'ANOMALY_DELAY' | 'DELIVERY_DELAY';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message?: string;
    relatedProcessId?: string;
    createdAt?: string;
    readAt?: string;
    dismissedAt?: string;
}

/** Number of days a BP must be in WaitingResponse before it's flagged as an anomaly */
const ANOMALY_THRESHOLD_DAYS = 7;

/** HCDP-05-01 F2 — fallback overdue threshold when no ETA is known for a fulfilment */
const DELIVERY_DELAY_FALLBACK_DAYS = 5;

/** Lightweight metadata about a single BPE process instance, returned by the
 *  BPE `/monitor/process-summary/{processInstanceID}` endpoint. Used to enrich
 *  the watchlist label so users see the BP type and product name instead of an
 *  opaque "Group 13". */
export interface ProcessSummary {
    processInstanceID: string;
    type?: string;          // REQUESTFORQUOTATION | QUOTATION | ORDER | DESPATCHADVICE | ...
    products?: string[];    // related product names (best-effort)
    partner?: string;       // partner legal name (best-effort)
    submissionDate?: string;
    hasReceiptAdvice?: boolean; // HCDP-05-01 F2 — true when a ReceiptAdvice exists for a fulfilment process
    eta?: string | null;        // HCDP-05-01 F2 — ISO string or null; null triggers fallback threshold
    deadline?: string | null;   // HCDP-05-03 F1 — earliest requestedDeliveryPeriod.endDate from upstream ORDER doc; null when unset
}

@Injectable()
export class MonitorService {
    private catalogUrl = catalogue_endpoint;
    private bpeUrl = bpe_endpoint;

    constructor(private http: HttpClient,
                private cookieService: CookieService,
                private translateService: TranslateService) {}

    /** Translate a key synchronously, falling back to the key itself if i18n is missing. */
    private t(key: string): string {
        const v = this.translateService.instant(key);
        return v && v !== key ? v : key;
    }

    // ---------------------------------------------------------------- Auth
    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
        });
    }

    private getUserId(): string {
        return this.cookieService.get('user_id');
    }

    private getCompanyId(): string {
        return this.cookieService.get('company_id');
    }

    // ---------------------------------------------------------------- Watchlist CRUD
    getWatchlist(): Promise<WatchlistEntry[]> {
        const url = `${this.catalogUrl}/monitor/watchlist?userId=${this.getUserId()}`;
        return this.http.get<WatchlistEntry[]>(url, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => []);
    }

    addWatchlistEntry(entry: Partial<WatchlistEntry>): Promise<WatchlistEntry> {
        const payload: WatchlistEntry = {
            userId: this.getUserId(),
            watchType: entry.watchType,
            targetId: entry.targetId,
            targetLabel: entry.targetLabel || entry.targetId,
            lastSeenStatus: entry.lastSeenStatus || null,
            lastSeenBpCount: entry.lastSeenBpCount || 0,
            lastAnomalyAlerted: false
        };
        return this.http.post<WatchlistEntry>(
            `${this.catalogUrl}/monitor/watchlist`, payload, { headers: this.getHeaders() })
            .toPromise();
    }

    updateWatchlistState(hjid: number, patch: Partial<WatchlistEntry>): Promise<WatchlistEntry> {
        return this.http.put<WatchlistEntry>(
            `${this.catalogUrl}/monitor/watchlist/${hjid}`, patch, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => null);
    }

    removeWatchlistEntry(hjid: number): Promise<void> {
        const url = `${this.catalogUrl}/monitor/watchlist/${hjid}?userId=${this.getUserId()}`;
        return this.http.delete<void>(url, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => {});
    }

    // ---------------------------------------------------------------- Notifications
    getNotifications(): Promise<MonitorNotification[]> {
        const url = `${this.catalogUrl}/monitor/notifications?userId=${this.getUserId()}`;
        return this.http.get<MonitorNotification[]>(url, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => []);
    }

    getBadgeCount(): Promise<number> {
        const url = `${this.catalogUrl}/monitor/badge-count?userId=${this.getUserId()}`;
        return this.http.get<number>(url, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => 0);
    }

    createNotification(n: Partial<MonitorNotification>): Promise<MonitorNotification> {
        const payload: MonitorNotification = {
            userId: this.getUserId(),
            watchlistEntryHjid: n.watchlistEntryHjid,
            notificationType: n.notificationType,
            severity: n.severity,
            title: n.title,
            message: n.message || null,
            relatedProcessId: n.relatedProcessId || null
        };
        return this.http.post<MonitorNotification>(
            `${this.catalogUrl}/monitor/notifications`, payload, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => null);
    }

    markAsRead(hjid: number): Promise<void> {
        return this.http.post<void>(
            `${this.catalogUrl}/monitor/notifications/${hjid}/read`, null, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => {});
    }

    dismiss(hjid: number): Promise<void> {
        return this.http.post<void>(
            `${this.catalogUrl}/monitor/notifications/${hjid}/dismiss`, null, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => {});
    }

    markAllRead(): Promise<void> {
        return this.http.post<void>(
            `${this.catalogUrl}/monitor/notifications/read-all?userId=${this.getUserId()}`,
            null, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => {});
    }

    clearAll(): Promise<void> {
        return this.http.post<void>(
            `${this.catalogUrl}/monitor/notifications/clear-all?userId=${this.getUserId()}`,
            null, { headers: this.getHeaders() })
            .toPromise()
            .catch(() => {});
    }

    // ---------------------------------------------------------------- BPE helpers (direct calls)
    private getBpeHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.cookieService.get('bearer_token'),
            'federationId': FEDERATIONID()
        });
    }

    /** Get current status of a specific BP process instance via BPE. Returns null on error. */
    private getBpCurrentStatus(processInstanceId: string): Promise<{ status: string, creationDate: string } | null> {
        const url = `${this.bpeUrl}/processInstance/${processInstanceId}/collaboration-group`;
        return this.http.get<any>(url, { headers: this.getBpeHeaders() })
            .toPromise()
            .then(group => {
                if (!group || !group.associatedProcessInstanceGroups || !group.associatedProcessInstanceGroups.length) {
                    return null;
                }
                const pig = group.associatedProcessInstanceGroups[0];
                // creationDate: check processInstances if available (some BPE versions return it)
                let creationDate: string = null;
                if (pig.processInstances && pig.processInstances.length) {
                    const pi = pig.processInstances.find(p => p.processInstanceID === processInstanceId);
                    if (pi) creationDate = pi.creationDate;
                }
                return { status: pig.status || 'Unknown', creationDate };
            })
            .catch(() => null);
    }

    /** Get count of collaboration groups involving a specific partner. Returns null on error. */
    private getPartnerBpCount(partnerPartyId: string): Promise<number | null> {
        const myPartyId = this.getCompanyId();
        // Use tradingPartnerIDs filter to get only BPs with this specific partner
        const url = `${this.bpeUrl}/collaboration-groups?partyId=${myPartyId}&limit=1&page=0&archived=false&tradingPartnerIDs=${partnerPartyId}`;
        return this.http.get<any>(url, { headers: this.getBpeHeaders() })
            .toPromise()
            .then(resp => {
                if (resp && resp.collaborationGroups !== undefined) {
                    return resp.size !== undefined ? resp.size : (resp.collaborationGroups || []).length;
                }
                return 0;
            })
            .catch(() => null);
    }

    // ---------------------------------------------------------------- Lazy detection (called on tab open)
    /**
     * Runs detection for all watchlist entries:
     * - BP watch: detects status changes + anomalies (WaitingResponse > threshold)
     * - Partner watch: detects new BPs started with the partner
     *
     * Persists new notifications to catalog-service and updates watchlist entry state.
     * Returns updated notification list after detection.
     */
    async runDetectionAndGetNotifications(): Promise<MonitorNotification[]> {
        let entries: WatchlistEntry[] = [];
        try { entries = await this.getWatchlist(); } catch (e) { entries = []; }

        const detectionPromises = entries.map(entry => this.detectForEntry(entry));
        await Promise.all(detectionPromises);

        // After detection, load and return fresh notifications (mark all as read on open)
        await this.markAllRead();
        return this.getNotifications();
    }

    private async detectForEntry(entry: WatchlistEntry): Promise<void> {
        if (!entry.hjid) return;

        if (entry.watchType === 'BUSINESS_PROCESS') {
            await this.detectBpChanges(entry);
            await this.detectDeliveryDelay(entry);
        } else if (entry.watchType === 'PARTNER') {
            await this.detectPartnerChanges(entry);
        }
    }

    /**
     * HCDP-05-01 F2 — raises a DELIVERY_DELAY notification when a watched fulfilment
     * process has a DespatchAdvice but no ReceiptAdvice past ETA+1d (or a 5-day fallback).
     * Dedupes against the current notification list so repeated detection runs don't spam.
     */
    private async detectDeliveryDelay(entry: WatchlistEntry): Promise<void> {
        const summary = await this.getProcessSummary(entry.targetId);
        // Only fulfilment processes are eligible — their originating document is a DespatchAdvice.
        if (!summary || !summary.type || summary.type.toUpperCase() !== 'DESPATCHADVICE') return;
        // Already delivered, skip.
        if (summary.hasReceiptAdvice) return;

        const despatchMs = summary.submissionDate ? new Date(summary.submissionDate).getTime() : NaN;
        if (isNaN(despatchMs)) return;

        const thresholdMs = summary.eta
            ? new Date(summary.eta).getTime() + 24 * 3600 * 1000
            : despatchMs + DELIVERY_DELAY_FALLBACK_DAYS * 24 * 3600 * 1000;
        if (Date.now() < thresholdMs) return;

        // Dedupe: skip if an active DELIVERY_DELAY already exists for this entry.
        const existing = await this.getNotifications();
        const alreadyFired = existing.some(n =>
            n.notificationType === 'DELIVERY_DELAY'
            && n.watchlistEntryHjid === entry.hjid
            && !n.dismissedAt);
        if (alreadyFired) return;

        const days = Math.max(1, Math.floor((Date.now() - despatchMs) / (24 * 3600 * 1000)));
        const label = entry.targetLabel || this.t('Fulfilment');
        const title = `${label}: ${this.t('delivery overdue')}`;
        const message = `${this.t('DispatchAdvice sent')} ${days} ${this.t('days ago without a receipt')}.`;
        await this.createNotification({
            watchlistEntryHjid: entry.hjid,
            notificationType: 'DELIVERY_DELAY',
            severity: 'CRITICAL',
            title,
            message,
            relatedProcessId: entry.targetId
        });
    }

    private async detectBpChanges(entry: WatchlistEntry): Promise<void> {
        const current = await this.getBpCurrentStatus(entry.targetId);
        if (!current) return;

        const { status, creationDate } = current;
        const previousStatus = entry.lastSeenStatus;

        const label = entry.targetLabel || this.t('Process');

        // 1. Status change notification
        if (previousStatus && status && status !== previousStatus) {
            let statusMsgKey: string;
            if (status === 'Approved') {
                statusMsgKey = 'The process has been approved. You can proceed to the next step.';
            } else if (status === 'Denied') {
                statusMsgKey = 'The process has been denied. Review the response from your partner.';
            } else {
                statusMsgKey = 'A response or action may be required.';
            }
            const title = `${label}: ${this.t('status changed to')} "${status}"`;
            const message = `${this.t('Previously')}: "${previousStatus}" → ${this.t('Now')}: "${status}". ${this.t(statusMsgKey)}`;
            await this.createNotification({
                watchlistEntryHjid: entry.hjid,
                notificationType: 'STATUS_CHANGE',
                severity: status === 'Approved' ? 'INFO' : (status === 'Denied' ? 'CRITICAL' : 'WARNING'),
                title,
                message,
                relatedProcessId: entry.targetId
            });
        }

        // 2. Anomaly detection: WaitingResponse for too long
        if (status === 'WaitingResponse' && !entry.lastAnomalyAlerted) {
            const isAnomaly = this.isOlderThanThreshold(creationDate, ANOMALY_THRESHOLD_DAYS);
            if (isAnomaly) {
                const title = `${label}: ${this.t('awaiting response for')} ${ANOMALY_THRESHOLD_DAYS}+ ${this.t('days')}`;
                const message = `${this.t('This process has been in "Waiting Response" status for over')} ${ANOMALY_THRESHOLD_DAYS} ${this.t('days. Consider following up with your trading partner.')}`;
                await this.createNotification({
                    watchlistEntryHjid: entry.hjid,
                    notificationType: 'ANOMALY_DELAY',
                    severity: 'CRITICAL',
                    title,
                    message,
                    relatedProcessId: entry.targetId
                });
                await this.updateWatchlistState(entry.hjid, { lastAnomalyAlerted: true, lastSeenStatus: status });
                return; // state updated — skip the normal status update below
            }
        }

        // Reset anomaly flag if status improved
        const anomalyReset = entry.lastAnomalyAlerted && status !== 'WaitingResponse';
        if (previousStatus !== status || anomalyReset) {
            await this.updateWatchlistState(entry.hjid, {
                lastSeenStatus: status,
                lastAnomalyAlerted: anomalyReset ? false : entry.lastAnomalyAlerted
            });
        }
    }

    private async detectPartnerChanges(entry: WatchlistEntry): Promise<void> {
        const currentCount = await this.getPartnerBpCount(entry.targetId);
        if (currentCount === null) return;

        const previousCount = entry.lastSeenBpCount || 0;
        if (currentCount > previousCount) {
            const diff = currentCount - previousCount;
            const partnerName = entry.targetLabel || this.t('your trading partner');
            const titleFrag = diff > 1
                ? this.t('new collaboration processes with')
                : this.t('new collaboration process with');
            const messageFrag = diff > 1
                ? this.t('new business processes have been started with')
                : this.t('new business process has been started with');
            const title = `${diff} ${titleFrag} ${partnerName}`;
            const message =
                `${diff} ${messageFrag} ${partnerName}. ` +
                `${this.t('Total with this partner')}: ${currentCount}. ` +
                `${this.t('Check Purchases or Sales for details.')}`;
            await this.createNotification({
                watchlistEntryHjid: entry.hjid,
                notificationType: 'NEW_PROCESS',
                severity: 'INFO',
                title,
                message
            });
            await this.updateWatchlistState(entry.hjid, { lastSeenBpCount: currentCount });
        }
    }

    private isOlderThanThreshold(dateStr: string, days: number): boolean {
        if (!dateStr) return false;
        try {
            const created = new Date(dateStr).getTime();
            const now = Date.now();
            const thresholdMs = days * 24 * 60 * 60 * 1000;
            return (now - created) > thresholdMs;
        } catch (e) {
            return false;
        }
    }

    // ---------------------------------------------------------------- BPE list for "Watch a Process" modal
    /**
     * Returns collaboration groups for current user — used to populate the
     * "Watch a Process" dropdown (shows processes the user can choose to watch).
     */
    getMyCollaborationGroups(): Promise<any[]> {
        const partyId = this.getCompanyId();
        // BPE requires: partyId, collaborationRole, offset, limit, archived — and federationId as header
        const url = `${this.bpeUrl}/collaboration-groups?partyId=${partyId}&collaborationRole=BUYER&offset=0&limit=20&archived=false`;
        return this.http.get<any>(url, { headers: this.getBpeHeaders() })
            .toPromise()
            .then(resp => {
                if (resp && resp.collaborationGroups) return resp.collaborationGroups;
                return [];
            })
            .catch(() => []);
    }

    /**
     * Lookup metadata (BP type, related products, partner name) for a single process instance.
     * Backed by BPE which reads directly from process_document_metadata_dao. Falls back to null
     * on any error so callers can degrade gracefully.
     *
     * Sends `callerPartyId`/`callerFederationId` headers so the backend can pick the OTHER
     * side of the conversation as the partner (otherwise we don't know which is which).
     */
    getProcessSummary(processInstanceID: string): Promise<ProcessSummary | null> {
        const url = `${this.bpeUrl}/monitor/process-summary/${processInstanceID}`;
        const headers = this.getBpeHeaders()
            .set('callerPartyId', this.getCompanyId())
            .set('callerFederationId', FEDERATIONID());
        return this.http.get<ProcessSummary>(url, { headers })
            .toPromise()
            .then(s => s ? ({
                processInstanceID: s.processInstanceID,
                type: s['type'],
                products: s['products'] || [],
                partner: s['partner'],
                submissionDate: s['submissionDate'],
                hasReceiptAdvice: s['hasReceiptAdvice'] === true,
                eta: s['eta'] != null ? s['eta'] : null,
                deadline: s['deadline'] != null ? s['deadline'] : null
            }) : null)
            .catch(() => null);
    }

    /**
     * Returns the user's trading partners from the BPE process-instance-group filters.
     * Uses the filters endpoint which already aggregates tradingPartnerIDs + tradingPartnerNames.
     */
    getMyTradingPartners(): Promise<{ partyId: string, name: string }[]> {
        const partyId = this.getCompanyId();
        // The filters endpoint aggregates all trading partners across all collaboration groups
        const url = `${this.bpeUrl}/process-instance-groups/filters?partyId=${partyId}&collaborationRole=BUYER&archived=false`;
        return this.http.get<any>(url, { headers: this.getBpeHeaders() })
            .toPromise()
            .then(resp => {
                if (!resp || !resp.tradingPartnerIDs) return [];
                const ids: string[] = resp.tradingPartnerIDs || [];
                const names: string[] = resp.tradingPartnerNames || [];
                return ids.map((id, i) => ({ partyId: id, name: names[i] || id }));
            })
            .catch(() => []);
    }
}
