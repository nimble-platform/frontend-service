/*
 * HCDP-05-04 F2 / HCDP-05-05 — Replace Provider modal
 *
 * Renders an inline modal (HCDP-04-02 watchlist-add pattern) collecting:
 *   1. Current provider (read-only, pre-filled from caller)
 *   2. New provider (dropdown of carriers fetched from catalog-service
 *      `/logistics-providers`, which proxies indexing-service party search)
 *   3. Reason note (optional, max 500 chars)
 *
 * Emits (replaced) with the chosen new provider + reason on confirm; emits
 * (cancelled) on cancel/close. The actual PATCH call lives in receipt-advice
 * (executeReplacement) — this component is a presentation-only collector.
 *
 * HCDP-05-05: no offline fallback. When the directory endpoint is unreachable
 * the modal surfaces a "Logistics directory unavailable" banner and Confirm
 * stays disabled — keeps the single-source-of-truth contract honest.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
    LogisticsProvider,
    CANCELLATION_WINDOW_DAYS,
} from './logistics-providers';
import { LogisticsProvidersService } from './logistics-providers.service';

export interface ReplaceProviderResult {
    newProvider: LogisticsProvider;
    reason: string | null;
}

@Component({
    selector: 'replace-provider-modal',
    templateUrl: './replace-provider-modal.component.html',
    styleUrls: ['./replace-provider-modal.component.css'],
})
export class ReplaceProviderModalComponent implements OnInit {

    @Input() currentProviderName: string | null = null;
    @Input() submitting = false; // parent sets true while PATCH is in-flight

    @Output() replaced = new EventEmitter<ReplaceProviderResult>();
    @Output() cancelled = new EventEmitter<void>();

    /** Slug of the currently-selected new provider (LogisticsProvider.slug). */
    selectedSlug: string | null = null;
    reason = '';
    providers: LogisticsProvider[] = [];
    /** Populated when `fetchActive()` resolves to an empty list because of
     *  an HTTP failure — surfaced in the modal as an unavailable banner. */
    loadError: string | null = null;
    /** True while the first fetch is in flight; suppresses the "no carriers"
     *  message during initial load. */
    loading = false;
    private fetched = false;

    readonly cancellationWindowDays = CANCELLATION_WINDOW_DAYS;

    constructor(private providersSvc: LogisticsProvidersService) {}

    ngOnInit(): void {
        // Pre-fetch in the background; modal could open before this resolves
        // — availableProviders() handles the empty case gracefully.
        this.fetchProvidersOnce();
    }

    /** Lazy fetch — also re-invoked from `open` setter so the list is ready
     *  the first time the modal actually appears. */
    private _open = false;
    @Input() set open(value: boolean) {
        this._open = value;
        if (value) this.fetchProvidersOnce();
    }
    get open(): boolean { return this._open; }

    private fetchProvidersOnce(): void {
        if (this.fetched) return;
        this.fetched = true;
        this.loading = true;
        this.providersSvc.fetchActive().then(list => {
            this.providers = list || [];
            this.loadError = this.providersSvc.lastError;
            this.loading = false;
        });
    }

    /** Alternatives list excluding the current provider (avoid no-op replacement). */
    availableProviders(): LogisticsProvider[] {
        return this.providers.filter(p => p.name !== this.currentProviderName);
    }

    /** True when the directory fetch failed AND the list is empty —
     *  triggers the modal's unavailable banner. */
    hasLoadError(): boolean {
        return !this.loading && this.providers.length === 0 && this.loadError !== null;
    }

    canConfirm(): boolean {
        return !this.submitting && this.selectedSlug !== null && this.providers.length > 0;
    }

    onConfirm(): void {
        const picked = this.providers.find(p => p.slug === this.selectedSlug);
        if (!picked) return;
        this.replaced.emit({
            newProvider: picked,
            reason: this.reason.trim() || null,
        });
    }

    onCancel(): void {
        this.cancelled.emit();
        this.resetForm();
    }

    /** Called by parent after a successful replacement so the form is clean
     *  if the modal is reopened later. */
    resetForm(): void {
        this.selectedSlug = null;
        this.reason = '';
    }
}
