/*
 * HCDP-05-05 — Logistics Providers HTTP service.
 *
 * Thin wrapper over catalog-service `/logistics-providers`, which proxies
 * indexing-service party search (businessType="Logistics Provider"). The
 * directory is the same set of Nimble Parties Find Logistics search returns.
 *
 * No hardcoded fallback — on network/auth failure the service resolves to an
 * empty list and exposes `lastError` so the modal can render an
 * "unavailable" state. Treating indexing-service as a hard dependency keeps
 * the single-source-of-truth contract honest: a failed fetch never silently
 * lets the buyer pick a stale, party-less carrier.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ng2-cookies';
import { catalogue_endpoint } from '../../../globals';
import { LogisticsProvider } from './logistics-providers';

@Injectable()
export class LogisticsProvidersService {

    private url = catalogue_endpoint;

    /** Populated on the most recent fetch failure; null on success. */
    lastError: string | null = null;

    constructor(private http: HttpClient,
                private cookieService: CookieService) {}

    /**
     * Returns the active carrier list from catalog-service. Resolves to an
     * empty array on any HTTP failure and sets `lastError` so callers can
     * render an "Logistics directory unavailable" message.
     */
    fetchActive(): Promise<LogisticsProvider[]> {
        const headers = new HttpHeaders({
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
        });
        return this.http.get<any[]>(`${this.url}/logistics-providers`, { headers })
            .toPromise()
            .then(rows => {
                this.lastError = null;
                if (!rows || !rows.length) {
                    return [];
                }
                return rows.map(r => ({
                    slug: r.slug,
                    name: r.name,
                    country: r.country || '',
                    partyId: r.partyId,
                    federationInstanceID: r.federationInstanceID || null,
                } as LogisticsProvider));
            })
            .catch(err => {
                const status = err && err.status;
                this.lastError = status
                    ? `Logistics directory unavailable (HTTP ${status})`
                    : 'Logistics directory unavailable (network error)';
                console.error('LogisticsProviders fetch failed:', this.lastError, err);
                return [];
            });
    }
}
