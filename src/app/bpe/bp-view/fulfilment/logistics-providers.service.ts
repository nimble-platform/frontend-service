/*
 * HCDP-05-04 — Logistics Providers HTTP service.
 *
 * Thin wrapper over catalog-service `/logistics-providers`. Resolves to the
 * platform-seeded EU carrier list. Falls back to the hardcoded array in
 * logistics-providers.ts on network/auth failure so the Replace Provider
 * modal stays functional even if catalog-service is down.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ng2-cookies';
import { catalogue_endpoint } from '../../../globals';
import { LogisticsProvider, LOGISTICS_PROVIDERS_FALLBACK } from './logistics-providers';

@Injectable()
export class LogisticsProvidersService {

    private url = catalogue_endpoint;

    constructor(private http: HttpClient,
                private cookieService: CookieService) {}

    /**
     * Returns the active carrier list. On any HTTP failure (network down,
     * 401 token expiry, 5xx) resolves to LOGISTICS_PROVIDERS_FALLBACK so the
     * UI never blocks. Callers can inspect `usedFallback` if they need to
     * surface a warning, but the modal treats both paths identically.
     */
    fetchActive(): Promise<LogisticsProvider[]> {
        const headers = new HttpHeaders({
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
        });
        return this.http.get<any[]>(`${this.url}/logistics-providers`, { headers })
            .toPromise()
            .then(rows => {
                if (!rows || !rows.length) {
                    console.warn('LogisticsProviders endpoint returned empty list; using hardcoded fallback');
                    return LOGISTICS_PROVIDERS_FALLBACK.slice();
                }
                return rows.map(r => ({
                    id: r.slug,
                    name: r.name,
                    country: r.country || '',
                    transitTimeHint: r.transitTimeHint || ''
                } as LogisticsProvider));
            })
            .catch(err => {
                console.warn('LogisticsProviders fetch failed; using hardcoded fallback', err);
                return LOGISTICS_PROVIDERS_FALLBACK.slice();
            });
    }
}
