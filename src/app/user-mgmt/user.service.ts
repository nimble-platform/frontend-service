import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {Party} from "../catalogue/model/publish/party";
import { CompanySettings } from './model/company-settings';
import { UserRegistration } from './model/user-registration';
import { CompanyRegistration } from './model/company-registration';
import { CompanyInvitation } from './model/company-invitation';
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import { CookieService } from 'ng2-cookies';
import { UserRole } from './model/user-role';
import { CompanyNegotiationSettings } from './model/company-negotiation-settings';

@Injectable()
export class UserService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private url = myGlobals.user_mgmt_endpoint;

    userParty: Party;


    constructor(
        private http: Http,
        private cookieService: CookieService
    ) { }

    setWelcomeFlag(flag: boolean): Promise<any> {
      const url = `${this.url}/set-welcome-info/${flag}`;
      const token = 'Bearer '+this.cookieService.get("bearer_token");
      const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
      return this.http
          .post(url, JSON.stringify({}), {headers: headers_token, withCredentials: true})
          .toPromise()
          .then(res => res.json())
          .catch(this.handleError);
    }

    registerUser(user: UserRegistration): Promise<any> {
        const url = `${this.url}/register/user`;
        return this.http
            .post(url, JSON.stringify(user), {headers: this.headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    registerCompany(company: CompanyRegistration) {
        const url = `${this.url}/register/company`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .post(url, JSON.stringify(company), {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getInviteList() {
        const url = `${this.url}/invitations`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .get(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

	deleteInvite(email:string) {
		var encodedMail = encodeURIComponent(email);
		const url = `${this.url}/invitations?username=${encodedMail}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .delete(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

    inviteCompany(invitation: CompanyInvitation) {
        const url = `${this.url}/send_invitation`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .post(url, JSON.stringify(invitation), {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    getParty(partyId:string):Promise<Party> {
        const url = `${this.url}/party/${partyId}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .get(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => {
                let party:Party = res.json();
                UBLModelUtils.removeHjidFieldsFromObject(party);
                return Promise.resolve(party);
            })
            .catch(this.handleError);
    }

    getUserParty(userId: string): Promise<Party> {
        if(this.userParty != null) {
            return Promise.resolve(this.userParty);
        }
        const url = `${this.url}/party_by_person/${userId}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .get(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => {
                this.userParty = res.json()[0];
                UBLModelUtils.removeHjidFieldsFromObject(this.userParty);
                return Promise.resolve(this.userParty);
            })
            .catch(this.handleError);
    }

    getSettings(userId: string): Promise<CompanySettings> {
        return this.getUserParty(userId).then(party => {
            const url = `${this.url}/company-settings/${party.id}`;
            const token = 'Bearer '+this.cookieService.get("bearer_token");
            const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
            return this.http
                .get(url, {headers: headers_token, withCredentials: true})
                .toPromise()
                .then(response => response.json() as CompanySettings)
                .catch(this.handleError)
        })
    }

    getUserRoles(): Promise<UserRole[]> {
        const url = `${this.url}/roles`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .get(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => {
                let roles: UserRole[] = [];
                const resultJson = res.json();
                for( var roleId in resultJson )
                    roles.push(new UserRole(roleId, resultJson[roleId]));
                return Promise.resolve(roles);
            })
            .catch(this.handleError);
    }

	setRoles(email: string, roleIDs: string[]) {
		const encodedMail = encodeURIComponent(email);
		const url = `${this.url}/roles/user?username=${encodedMail}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .post(url, JSON.stringify(roleIDs), {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

    putSettings(settings: CompanySettings, userId: string): Promise<any> {
        return this.getUserParty(userId).then(party => {
            const url = `${this.url}/company-settings/${party.id}`;
            const token = 'Bearer '+this.cookieService.get("bearer_token");
            const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
            return this.http
                .put(url, settings, {headers: headers_token, withCredentials: true})
                .toPromise()
                .then(response => response.json())
                .catch(this.handleError)
        });
    }

    getPrefCat(userId: string): Promise<any> {
      return this.getSettings(userId).then(settings => settings.preferredProductCategories);
    }

    togglePrefCat(userId: string, cat: string): Promise<any> {
      return this.getSettings(userId).then(settings => {
        var pref_cat = settings.preferredProductCategories;
        var cat_idx = pref_cat.indexOf(cat);
        if (cat_idx == -1)
          pref_cat.push(cat);
        else
          pref_cat.splice(cat_idx,1);
        settings.preferredProductCategories = pref_cat;
        return this.putSettings(settings,userId).then(response => response.preferredProductCategories)
      });
    }

    saveCert(file: File, name: string, type: string): Promise<any> {
      const url = `${this.url}/company-settings/certificate?name=${name}&type=${type}`;
      const token = 'Bearer '+this.cookieService.get("bearer_token");
      const headers_token = new Headers({'Authorization': token});
      const form_data: FormData = new FormData();
      form_data.append('file', file);
      return this.http
          .post(url, form_data, {headers: headers_token, withCredentials: true})
          .toPromise()
          .then(response => response.json())
          .catch(this.handleError)
    }

    downloadCert(id: string) {
      const url = `${this.url}/company-settings/certificate/${id}`;
      window.open(url,"_blank");
    }

    deleteCert(id: string): Promise<any> {
      const url = `${this.url}/company-settings/certificate/${id}`;
      const token = 'Bearer '+this.cookieService.get("bearer_token");
      const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
      return this.http
          .delete(url, {headers: headers_token, withCredentials: true})
          .toPromise()
          .then(response => response.json())
          .catch(this.handleError)
    }

    getCompanyNegotiationSettings(): Promise<CompanyNegotiationSettings> {
        const url = `${this.url}/company-settings/negotiation`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .get(url, { headers: headers_token, withCredentials: true })
            .toPromise()
            .then(res => {
                return this.sanitizeSettings(res.json());
            })
            .catch(this.handleError);
    }
    private sanitizeSettings(settings: CompanyNegotiationSettings): CompanyNegotiationSettings {
        if(settings.deliveryPeriodUnits.length === 0) {
            settings.deliveryPeriodUnits.push("day(s)");
            settings.deliveryPeriodRanges.push({ start: 1, end: 56 });
            settings.deliveryPeriodUnits.push("week(s)");
            settings.deliveryPeriodRanges.push({ start: 0, end: 8 });
        }
        if(settings.warrantyPeriodRanges.length === 0) {
            settings.warrantyPeriodUnits.push("month(s)");
            settings.warrantyPeriodRanges.push({ start: 0, end: 24 });
            settings.warrantyPeriodUnits.push("year(s)");
            settings.warrantyPeriodRanges.push({ start: 0, end: 2 });
        }
        return settings;
    }
    putCompanyNegotiationSettings(settings: CompanyNegotiationSettings): Promise<any> {
        const url = `${this.url}/company-settings/negotiation`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({ 'Content-Type': 'application/json', 'Authorization': token });
        return this.http
            .put(url, settings, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(response => response.json())
            .catch(this.handleError)
    }

    resetData():void {
        this.userParty = null;
    }

	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}

}
