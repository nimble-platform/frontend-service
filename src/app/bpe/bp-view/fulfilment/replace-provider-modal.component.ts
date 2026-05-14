/*
 * HCDP-05-04 F2 — Replace Provider modal
 *
 * Renders an inline modal (HCDP-04-02 watchlist-add pattern) collecting:
 *   1. Current provider (read-only, pre-filled from caller)
 *   2. New provider (dropdown of carriers fetched from catalog-service)
 *   3. Reason note (optional, max 500 chars)
 *
 * Emits (replaced) with the chosen new provider + reason on confirm; emits
 * (cancelled) on cancel/close. The actual PATCH call lives in receipt-advice
 * (executeReplacement) — this component is a presentation-only collector.
 *
 * Carrier list is fetched lazily on first open from
 * `GET /logistics-providers` via LogisticsProvidersService; falls back to the
 * hardcoded LOGISTICS_PROVIDERS_FALLBACK array if the endpoint is unreachable.
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

    selectedProviderId: string | null = null;
    reason = '';
    providers: LogisticsProvider[] = [];
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
        this.providersSvc.fetchActive().then(list => {
            this.providers = list || [];
        });
    }

    /** Alternatives list excluding the current provider (avoid no-op replacement). */
    availableProviders(): LogisticsProvider[] {
        return this.providers.filter(p => p.name !== this.currentProviderName);
    }

    canConfirm(): boolean {
        return !this.submitting && this.selectedProviderId !== null;
    }

    onConfirm(): void {
        const picked = this.providers.find(p => p.id === this.selectedProviderId);
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
        this.selectedProviderId = null;
        this.reason = '';
    }
}
