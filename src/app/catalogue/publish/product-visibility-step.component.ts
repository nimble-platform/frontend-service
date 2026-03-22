/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SimpleSearchService } from '../../simple-search/simple-search.service';
import { CallStatus } from '../../common/call-status';
import * as myGlobals from '../../globals';

@Component({
    selector: 'product-visibility-step',
    templateUrl: './product-visibility-step.component.html'
})
export class ProductVisibilityStepComponent implements OnInit, OnChanges, OnDestroy {

    @Input() whiteListCompanies: any[] = [];
    @Input() blackListCompanies: any[] = [];
    @Input() disabled: boolean = false;

    @Output() whiteListCompaniesChange = new EventEmitter<any[]>();
    @Output() blackListCompaniesChange = new EventEmitter<any[]>();
    @Output() visibilityModeChange = new EventEmitter<string>();

    // current mode: public / whitelist / blacklist
    visibilityMode: string = 'public';

    searchQuery: string = '';
    searchResults: any[] = [];
    searchCallStatus: CallStatus = new CallStatus();

    // debounce timer reference
    private searchTimer: any = null;

    // tracks IDs of companies added but whose VAT lookup is still in flight
    pendingCompanyIds: Set<string> = new Set();

    constructor(private simpleSearchService: SimpleSearchService,
                private http: HttpClient,
                private cdr: ChangeDetectorRef) {}

    // Tracks whether we already enriched names to avoid re-running on every change
    private enriched = false;

    ngOnInit() {
        // Inform parent of the initial mode (important for edit mode)
        this.visibilityModeChange.emit(this.visibilityMode);
    }

    ngOnChanges(changes: SimpleChanges) {
        // Wait for the first time the pre-loaded lists arrive from the parent (edit mode).
        // Because the component lives behind [hidden] it is created before @Input values
        // are populated, so ngOnInit always sees empty arrays — ngOnChanges fires later.
        if (this.enriched) { return; }

        const wl: any[] = this.whiteListCompanies || [];
        const bl: any[] = this.blackListCompanies || [];

        if (wl.length > 0) {
            this.enriched = true;
            this.visibilityMode = 'whitelist';
            this.enrichCompanyNames(wl);
            this.visibilityModeChange.emit(this.visibilityMode);
        } else if (bl.length > 0) {
            this.enriched = true;
            this.visibilityMode = 'blacklist';
            this.enrichCompanyNames(bl);
            this.visibilityModeChange.emit(this.visibilityMode);
        }
    }

    // In edit mode, companies are loaded with legalName = vatNumber (VAT string).
    // Look up the real company name from the indexing service by vatNumber field.
    // Replaces the whole array reference so Angular change detection picks up the update.
    private enrichCompanyNames(companies: any[]) {
        const requests = companies.map((company, idx) => {
            if (company.legalName !== company.vatNumber) { return of(null); }
            return from(this.simpleSearchService.getCompanies('vatNumber:"' + company.vatNumber + '"', [], 1)).pipe(
                map((res: any) => {
                    const legalName = res && res.result && res.result.length > 0 ? res.result[0].legalName : null;
                    return legalName ? { idx, legalName } : null;
                }),
                catchError(() => of(null))
            );
        });

        forkJoin(requests).subscribe(results => {
            const updated = companies.slice();
            let changed = false;
            results.forEach(r => {
                if (r) {
                    updated[r.idx] = Object.assign({}, updated[r.idx], { legalName: r.legalName });
                    changed = true;
                }
            });
            if (!changed) { return; }
            // Replace array reference and force change detection
            if (this.visibilityMode === 'whitelist') {
                this.whiteListCompanies = updated;
                this.whiteListCompaniesChange.emit(this.whiteListCompanies);
            } else {
                this.blackListCompanies = updated;
                this.blackListCompaniesChange.emit(this.blackListCompanies);
            }
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy() {
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
    }

    onVisibilityModeChange() {
        // Clear the list that no longer applies when switching modes
        if (this.visibilityMode === 'public') {
            this.whiteListCompanies = [];
            this.blackListCompanies = [];
            this.whiteListCompaniesChange.emit(this.whiteListCompanies);
            this.blackListCompaniesChange.emit(this.blackListCompanies);
        } else if (this.visibilityMode === 'whitelist') {
            this.blackListCompanies = [];
            this.blackListCompaniesChange.emit(this.blackListCompanies);
        } else {
            this.whiteListCompanies = [];
            this.whiteListCompaniesChange.emit(this.whiteListCompanies);
        }
        this.searchResults = [];
        this.searchQuery = '';
        this.pendingCompanyIds.clear();
        // Notify parent of the new mode so it can gate the Next button
        this.visibilityModeChange.emit(this.visibilityMode);
    }

    onSearchInput(query: string) {
        // Debounce: wait 400 ms after the user stops typing before searching
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
        if (!query || query.trim().length < 1) {
            this.searchResults = [];
            return;
        }
        this.searchTimer = setTimeout(() => this.executeSearch(query), 400);
    }

    private executeSearch(query: string) {
        this.searchCallStatus.submit();
        // pageRef omitted to use local identity-service endpoint
        this.simpleSearchService.getComp(query, [], [], 1, 10, 'legalName asc', 'Name')
            .then(res => {
                this.searchResults = (res && res.result) ? res.result : [];
                this.searchCallStatus.callback('', true);
            })
            .catch(err => {
                this.searchCallStatus.error('Company search failed.', err);
            });
    }

    addCompany(company: any) {
        // If the search result contains a valid vatNumber, use it directly.
        // Otherwise the indexing-service omits vatNumber from its response (local
        // deployments), so fetch the real VAT from the identity-service party endpoint
        // — the catalogue-service enforcement compares permittedParties against the
        // JWT vatin claim, so we must store the VAT string, not the numeric party ID.
        const rawVat = company.vatNumber;
        if (rawVat && rawVat !== 'undefined') {
            this.doAddCompany(company.legalName, rawVat);
        } else {
            const partyId = String(company.id || company.uri || '');
            if (!partyId) { return; }
            // Mark as pending immediately so the UI shows "Added" while the
            // identity-service call is in flight
            this.pendingCompanyIds.add(partyId);
            const url = myGlobals.user_mgmt_endpoint + '/party/' + partyId;
            const bearerToken = this.getCookie('bearer_token');
            const headers = bearerToken
                ? new HttpHeaders({ 'Authorization': 'Bearer ' + bearerToken })
                : new HttpHeaders();
            this.http.get<any>(url, { headers }).toPromise()
                .then(party => {
                    let vat: string | null = null;
                    const taxSchemes = party && party.partyTaxScheme;
                    if (taxSchemes && taxSchemes.length > 0) {
                        vat = taxSchemes[0].taxScheme &&
                              taxSchemes[0].taxScheme.taxTypeCode &&
                              taxSchemes[0].taxScheme.taxTypeCode.value || null;
                    }
                    this.pendingCompanyIds.delete(partyId);
                    this.doAddCompany(company.legalName, vat || partyId);
                })
                .catch(() => {
                    // Identity service unreachable — fall back to numeric ID
                    this.pendingCompanyIds.delete(partyId);
                    this.doAddCompany(company.legalName, partyId);
                });
        }
    }

    private doAddCompany(legalName: string, identifier: string) {
        const entry = { vatNumber: identifier, legalName: legalName };
        if (this.visibilityMode === 'whitelist') {
            if (!this.whiteListCompanies.find(c => c.vatNumber === entry.vatNumber)) {
                this.whiteListCompanies = this.whiteListCompanies.concat([entry]);
                this.whiteListCompaniesChange.emit(this.whiteListCompanies);
            }
        } else if (this.visibilityMode === 'blacklist') {
            if (!this.blackListCompanies.find(c => c.vatNumber === entry.vatNumber)) {
                this.blackListCompanies = this.blackListCompanies.concat([entry]);
                this.blackListCompaniesChange.emit(this.blackListCompanies);
            }
        }
    }

    private getCookie(name: string): string | null {
        const match = document.cookie.split(';')
            .map(c => c.trim())
            .find(c => c.startsWith(name + '='));
        return match ? decodeURIComponent(match.split('=')[1]) : null;
    }

    removeCompany(mode: string, index: number) {
        if (mode === 'whitelist') {
            this.whiteListCompanies = this.whiteListCompanies.filter((_, i) => i !== index);
            this.whiteListCompaniesChange.emit(this.whiteListCompanies);
        } else {
            this.blackListCompanies = this.blackListCompanies.filter((_, i) => i !== index);
            this.blackListCompaniesChange.emit(this.blackListCompanies);
        }
    }

    isAlreadyAdded(companyId: string): boolean {
        // companyId may be the numeric party id (from search results) or a VAT string (from edit mode).
        // pendingCompanyIds stores numeric ids while whiteList/blackList store VAT strings,
        // so check both collections against both representations.
        const idStr = String(companyId);
        return this.pendingCompanyIds.has(idStr)
            || this.whiteListCompanies.some(c => c.vatNumber === idStr || String(c.id) === idStr)
            || this.blackListCompanies.some(c => c.vatNumber === idStr || String(c.id) === idStr);
    }
}
