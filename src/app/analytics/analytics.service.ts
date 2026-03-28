/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import { CookieService } from 'ng2-cookies';
import {DEFAULT_LANGUAGE} from '../catalogue/model/constants';

@Injectable()
export class AnalyticsService {

    private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    private url_da = myGlobals.data_aggregation_endpoint;
    private url_bpe = `${myGlobals.bpe_endpoint}/statistics`;
    private url_trust = myGlobals.trust_service_endpoint;
    private url_identity = myGlobals.user_mgmt_endpoint;

    constructor(
        private http: HttpClient,
        private cookieService: CookieService
    ) {
    }

    private avgNonZero(a: number, b: number): number {
        const nonZero = [a, b].filter(v => v !== 0);
        return nonZero.length > 0 ? nonZero.reduce((s, v) => s + v, 0) / nonZero.length : 0;
    }

    private avgNonZeroMap(a: any, b: any): any {
        const result: any = {};
        Object.keys(a || {}).forEach(k => { result[k] = this.avgNonZero(a[k], (b || {})[k] || 0); });
        Object.keys(b || {}).forEach(k => { if (result[k] === undefined) { result[k] = b[k]; } });
        return result;
    }

    getPlatAnalytics(): Promise<any> {
        const h = this.getAuthorizedHeaders();
        const bpe = this.url_bpe;
        const safe = (p: Promise<any>, fallback: any) => p.catch(() => fallback);
        return Promise.all([
            safe(this.http.get(`${this.url_identity}/statistics/`, {headers: h}).toPromise(), {totalUsers: 0, totalCompanies: 0}),
            safe(this.http.get(`${bpe}/total-number/business-process?status=Approved&role=seller`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=WaitingResponse&role=seller`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=Denied&role=seller`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=Approved&role=buyer`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=WaitingResponse&role=buyer`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=Denied&role=buyer`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/trading-volume?status=Approved`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/trading-volume?status=WaitingResponse`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/trading-volume?status=Denied`, {headers: h}).toPromise(), 0)
        ]).then(([identity, sApproved, sWaiting, sDenied, bApproved, bWaiting, bDenied, tvApproved, tvWaiting, tvDenied]) => ({
            identity: identity,
            businessProcessCount: {state: {
                approved: Math.round(((sApproved || 0) + (bApproved || 0)) / 2),
                waiting:  Math.round(((sWaiting  || 0) + (bWaiting  || 0)) / 2),
                denied:   Math.round(((sDenied   || 0) + (bDenied   || 0)) / 2)
            }},
            tradingVolume: {approved: tvApproved || 0, waiting: tvWaiting || 0, denied: tvDenied || 0}
        })).catch(this.handleError);
    }

    getPlatCollabAnalytics(): Promise<any> {
        const h = this.getAuthorizedHeaders();
        const bpe = this.url_bpe;
        const safe = (p: Promise<any>, fallback: any) => p.catch(() => fallback);
        return Promise.all([
            safe(this.http.get(`${bpe}/collaboration-time?role=SELLER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/collaboration-time?role=BUYER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/collaboration-time-months?role=SELLER`, {headers: h}).toPromise(), {}),
            safe(this.http.get(`${bpe}/collaboration-time-months?role=BUYER`, {headers: h}).toPromise(), {}),
            safe(this.http.get(`${bpe}/response-time`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/response-time-months`, {headers: h}).toPromise(), {})
        ]).then(([collabSeller, collabBuyer, collabSellerMonths, collabBuyerMonths, responseTime, responseTimeMonths]) => ({
            collaborationTime: {
                averageCollabTime: this.avgNonZero(collabSeller || 0, collabBuyer || 0),
                averageCollabTimeSales: collabSeller || 0,
                averageCollabTimePurchases: collabBuyer || 0,
                averageCollabTimeForMonths: this.avgNonZeroMap(collabSellerMonths, collabBuyerMonths),
                averageCollabTimeSalesForMonths: collabSellerMonths || {},
                averageCollabTimePurchasesForMonths: collabBuyerMonths || {}
            },
            responseTime: {
                averageTime: responseTime || 0,
                averageTimeForMonths: responseTimeMonths || {}
            }
        })).catch(this.handleError);
    }

    getPerfromanceAnalytics(comp: string): Promise<any> {
        const h = this.getAuthorizedHeaders();
        const bpe = this.url_bpe;
        const safe = (p: Promise<any>, fallback: any) => p.catch(() => fallback);
        return Promise.all([
            safe(this.http.get(`${this.url_identity}/statistics/`, {headers: h}).toPromise(), {totalUsers: 0, totalCompanies: 0}),
            safe(this.http.get(`${bpe}/total-number/business-process?status=Approved&partyId=${comp}&role=seller`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=WaitingResponse&partyId=${comp}&role=seller`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=Denied&partyId=${comp}&role=seller`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=Approved&partyId=${comp}&role=buyer`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=WaitingResponse&partyId=${comp}&role=buyer`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/total-number/business-process?status=Denied&partyId=${comp}&role=buyer`, {headers: h}).toPromise(), 0)
        ]).then(([identity, sApproved, sWaiting, sDenied, bApproved, bWaiting, bDenied]) => {
            const totSeller = (sApproved || 0) + (sWaiting || 0) + (sDenied || 0);
            const totBuyer  = (bApproved || 0) + (bWaiting || 0) + (bDenied || 0);
            const totAll    = totSeller + totBuyer;
            return {
                identity: identity,
                businessProcessCount: {
                    total: totAll,
                    state: {
                        approved: (sApproved || 0) + (bApproved || 0),
                        waiting:  (sWaiting  || 0) + (bWaiting  || 0),
                        denied:   (sDenied   || 0) + (bDenied   || 0)
                    },
                    role: {
                        seller: {approved: sApproved || 0, waiting: sWaiting || 0, denied: sDenied || 0, tot: totSeller},
                        buyer:  {approved: bApproved || 0, waiting: bWaiting || 0, denied: bDenied || 0, tot: totBuyer}
                    }
                }
            };
        }).catch(this.handleError);
    }

    getCollabAnalytics(comp: string): Promise<any> {
        const h = this.getAuthorizedHeaders();
        const bpe = this.url_bpe;
        const safe = (p: Promise<any>, fallback: any) => p.catch(() => fallback);
        return Promise.all([
            safe(this.http.get(`${bpe}/trading-volume?status=Approved&partyId=${comp}&role=SELLER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/trading-volume?status=WaitingResponse&partyId=${comp}&role=SELLER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/trading-volume?status=Denied&partyId=${comp}&role=SELLER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/trading-volume?status=Approved&partyId=${comp}&role=BUYER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/trading-volume?status=WaitingResponse&partyId=${comp}&role=BUYER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/trading-volume?status=Denied&partyId=${comp}&role=BUYER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/collaboration-time?partyId=${comp}&role=SELLER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/collaboration-time?partyId=${comp}&role=BUYER`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/collaboration-time-months?partyId=${comp}&role=SELLER`, {headers: h}).toPromise(), {}),
            safe(this.http.get(`${bpe}/collaboration-time-months?partyId=${comp}&role=BUYER`, {headers: h}).toPromise(), {}),
            safe(this.http.get(`${bpe}/response-time?partyId=${comp}`, {headers: h}).toPromise(), 0),
            safe(this.http.get(`${bpe}/response-time-months?partyId=${comp}`, {headers: h}).toPromise(), {})
        ]).then(([tvSellApproved, tvSellWaiting, tvSellDenied, tvBuyApproved, tvBuyWaiting, tvBuyDenied,
                  collabSeller, collabBuyer, collabSellerMonths, collabBuyerMonths, responseTime, responseTimeMonths]) => ({
            tradingVolumesales:    {approved: tvSellApproved || 0, waiting: tvSellWaiting || 0, denied: tvSellDenied || 0},
            tradingVolumespurchase:{approved: tvBuyApproved  || 0, waiting: tvBuyWaiting  || 0, denied: tvBuyDenied  || 0},
            collaborationTime: {
                averageCollabTime: this.avgNonZero(collabSeller || 0, collabBuyer || 0),
                averageCollabTimeSales:     collabSeller || 0,
                averageCollabTimePurchases: collabBuyer  || 0,
                averageCollabTimeForMonths:          this.avgNonZeroMap(collabSellerMonths, collabBuyerMonths),
                averageCollabTimeSalesForMonths:     collabSellerMonths || {},
                averageCollabTimePurchasesForMonths: collabBuyerMonths  || {}
            },
            responseTime: {
                averageTime:         responseTime       || 0,
                averageTimeForMonths: responseTimeMonths || {}
            }
        })).catch(this.handleError);
    }

    getCompAnalytics(comp: string): Promise<any> {
        const url = `${this.url_da}?companyID=${comp}`;
        return this.http
            .get(url, { headers: this.headers })
            .toPromise()
            .catch(this.handleError);
    }

    getNonOrdered(partyId: string): Promise<any> {
        const url = `${this.url_bpe}/non-ordered?partyId=${partyId}`;
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }

    getTrustPolicy(): Promise<any> {
        const url = `${this.url_trust}/policy/global`;
        let headers = this.getAuthorizedHeaders();
        return this.http
            .get(url, { headers: headers, withCredentials: true })
            .toPromise()
            .then(res => {
                // the server returns empty text if there is no global trust policy
                return res
            })
            .catch(this.handleError);
    }

    setTrustPolicy(policy: any): Promise<any> {
        const url = `${this.url_trust}/policy/global/update`;
        let headers = this.getAuthorizedHeaders();
        return this.http
            .post(url, JSON.stringify(policy), { headers: headers, withCredentials: true })
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    initTrustPolicy(): Promise<any> {
        const url = `${this.url_trust}/policy/global/initialize`;
        let headers = this.getAuthorizedHeaders();
        return this.http
            .post(url, null, { headers: headers, withCredentials: true })
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    getUnverifiedCompanies(page: number, sortBy?: string, orderBy?: string): Promise<any> {
        var url = `${this.url_identity}/admin/unverified_companies?page=${page}&sortBy=${sortBy}&orderBy=${orderBy}`;
        url += "&size=99999";
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers_token = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
        return this.http
            .get(url, { headers: headers_token, withCredentials: true })
            .toPromise()
            .catch(this.handleError);
    }

    getVerifiedCompanies(page: number, size?: number, sortBy?: string, orderBy?: string): Promise<any> {
        var url = `${this.url_identity}/admin/verified_companies?page=${page}&sortBy=${sortBy}&orderBy=${orderBy}`;
        if (size)
            url += "&size=" + size;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers_token = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
        return this.http
            .get(url, { headers: headers_token, withCredentials: true })
            .toPromise()
            .catch(this.handleError);
    }

    getAllParties(page: number): Promise<any> {
        const url = `${this.url_identity}/parties/all?page=${page}`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers_token = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': token });
        return this.http
            .get(url, { headers: headers_token, withCredentials: true })
            .toPromise()
            .catch(this.handleError);
    }

    verifyCompany(companyId: string): Promise<any> {
        const url = `${this.url_identity}/admin/verify_company?companyId=${companyId}`;
        let headers = this.getAuthorizedHeaders();

        return this.http
            .post(url, {}, { headers: headers, withCredentials: true })
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    rejectCompany(companyId: string): Promise<any> {
        const url = `${this.url_identity}/admin/reject_company/${companyId}`;
        let headers = this.getAuthorizedHeaders();

        return this.http
            .delete(url, { headers: headers, withCredentials: true })
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    deleteCompany(companyId: string): Promise<any> {
        const userId = this.cookieService.get("user_id");
        const url = `${this.url_identity}/admin/delete_company/${companyId}?userId=${userId}`;
        let headers = this.getAuthorizedHeaders();

        return this.http
            .delete(url, { headers: headers, withCredentials: true })
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    private getAuthorizedHeaders(): HttpHeaders {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        let headers = new HttpHeaders({ 'Accept': 'application/json', 'Authorization': token });
        this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
        let defaultLanguage = DEFAULT_LANGUAGE();
        let acceptLanguageHeader = defaultLanguage;
        if(defaultLanguage != "en"){
            acceptLanguageHeader += ",en;0.9";
        }
        headers.append("Accept-Language",acceptLanguageHeader);
        return headers;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
