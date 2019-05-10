import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {CookieService} from 'ng2-cookies';

@Injectable()
export class AnalyticsService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private url_da = myGlobals.data_aggregation_endpoint;
    private url_bpe = `${myGlobals.bpe_endpoint}/statistics`;
    private url_trust = myGlobals.trust_service_endpoint;
    private url_identity = myGlobals.user_mgmt_endpoint;

    constructor(
        private http: Http,
        private cookieService: CookieService
    ) {
    }

    getPlatAnalytics(): Promise<any> {
  		const url = `${this.url_da}`;
  		return this.http
  		.get(url, {headers: this.getAuthorizedHeaders()})
  		.toPromise()
  		.then(res => res.json())
  		.catch(this.handleError);
  	}

    getPerfromanceAnalytics(comp:string): Promise<any> {
  		const url = `${this.url_da}/company?companyID=${comp}`;
  		return this.http
  		.get(url, {headers: this.getAuthorizedHeaders()})
  		.toPromise()
  		.then(res => res.json())
  		.catch(this.handleError);
    }
    
    getCompAnalytics(comp:string): Promise<any> {
  		const url = `${this.url_da}?companyID=${comp}`;
  		return this.http
  		.get(url, {headers: this.headers})
  		.toPromise()
  		.then(res => res.json())
  		.catch(this.handleError);
  	}

    getNonOrdered(partyId:string): Promise<any> {
      const url = `${this.url_bpe}/non-ordered?partyId=${partyId}`;
      return this.http
  		.get(url, {headers: this.getAuthorizedHeaders()})
  		.toPromise()
  		.then(res => res.json())
  		.catch(this.handleError);
    }

    getTrustPolicy(): Promise<any> {
      const url = `${this.url_trust}/policy/global`;
      const token = 'Bearer '+this.cookieService.get("bearer_token");
      const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
      return this.http
  		.get(url, {headers: headers_token, withCredentials: true})
  		.toPromise()
  		.then(res => res.json())
  		.catch(this.handleError);
    }

    setTrustPolicy(policy:any): Promise<any> {
      const url = `${this.url_trust}/policy/global/update`;
      const token = 'Bearer '+this.cookieService.get("bearer_token");
      const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
      return this.http
  		.post(url, JSON.stringify(policy), {headers: headers_token, withCredentials: true})
  		.toPromise()
  		.then(res => res)
  		.catch(this.handleError);
    }

    initTrustPolicy(): Promise<any> {
      const url = `${this.url_trust}/policy/global/initialize`;
      const token = 'Bearer '+this.cookieService.get("bearer_token");
      const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
      return this.http
  		.post(url, null, {headers: headers_token, withCredentials: true})
  		.toPromise()
  		.then(res => res)
  		.catch(this.handleError);
    }

    getUnverifiedCompanies(page: number, sortBy?: string, orderBy?: string): Promise<any> {
        const url = `${this.url_identity}/admin/unverified_companies?page=${page}&sortBy=${sortBy}&orderBy=${orderBy}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .get(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getVerifiedCompanies(page: number, size?: number, sortBy?: string, orderBy?: string): Promise<any> {
        var url = `${this.url_identity}/admin/verified_companies?page=${page}&sortBy=${sortBy}&orderBy=${orderBy}`;
        if (size)
          url += "&size="+size;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .get(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getAllParties(page: number): Promise<any> {
        const url = `${this.url_identity}/parties/all?page=${page}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .get(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    verifyCompany(companyId:string): Promise<any> {
        const url = `${this.url_identity}/admin/verify_company?companyId=${companyId}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});

        return this.http
            .post(url, {}, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    deleteCompany(companyId:string): Promise<any> {
        const url = `${this.url_identity}/admin/delete_company/${companyId}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});

        return this.http
            .delete(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    private getAuthorizedHeaders(): Headers {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers = new Headers({'Accept': 'application/json','Authorization': token});
        this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
        return headers;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
