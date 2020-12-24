import {Demand} from '../catalogue/model/publish/demand';
import {Injectable} from '@angular/core';
import {catalogue_endpoint} from '../globals';
import {getAuthorizedHeaders} from '../common/utils';
import {Http} from '@angular/http';
import {UserService} from '../user-mgmt/user.service';
import {CookieService} from 'ng2-cookies';
import {DemandPaginationResponse} from './model/demand-pagination-response';
import {DEFAULT_LANGUAGE} from '../catalogue/model/constants';
import {Facet} from '../common/model/facet';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';

@Injectable()
export class DemandService {
    constructor(private http: Http,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    public publishDemand(demand: Demand): Promise<number> {
        const url = catalogue_endpoint + `/demands`;
        return this.http
            .post(url, demand, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .catch(this.handleError);
    }

    public getDemands(searchTerm: string = null, partyId: string = null, categoryUri: string = null, dueDate: string = null, buyerCountry: string = null, deliveryCountry: string = null,
                      page = 1, pageSize = 10): Promise<DemandPaginationResponse> {

        let url = catalogue_endpoint + `/demands?pageNo=${page}&limit=${pageSize}`;
        if (!!searchTerm) {
           url += `&query=${encodeURIComponent(searchTerm)}&lang=${DEFAULT_LANGUAGE()}`;
        }
        if (partyId) {
            url += `&companyId=${partyId}`;
        }
        if (categoryUri) {
            url += `&categoryUri=${encodeURIComponent(categoryUri)}`;
        }
        if (dueDate) {
            url += `&dueDate=${dueDate}`;
        }
        if (buyerCountry) {
            url += `&buyerCountry=${buyerCountry}`;
        }
        if (deliveryCountry) {
            url += `&deliveryCountry=${deliveryCountry}`;
        }
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => new DemandPaginationResponse(res.json()))
            .catch(this.handleError);
    }

    public getDemandFacets(searchTerm: string = null, partyId: string = null, categoryUri: string = null,
                           dueDate: string = null, buyerCountry: string = null, deliveryCountry: string = null): Promise<Facet[]> {
        let url = catalogue_endpoint + `/demand-facets`;
        let conditionExist = false;
        if (!!searchTerm) {
            url += `?query=${encodeURIComponent(searchTerm)}&lang=${DEFAULT_LANGUAGE()}`;
            conditionExist = true;
        }
        if (partyId) {
            let operator = '&';
            if (!conditionExist) {
                operator = '?';
                conditionExist = true;
            }
            url += `${operator}companyId=${partyId}`;
        }
        if (categoryUri) {
            let operator = '&';
            if (!conditionExist) {
                operator = '?';
                conditionExist = true;
            }
            url += `${operator}categoryUri=${encodeURIComponent(categoryUri)}`;
        }
        if (dueDate) {
            let operator = '&';
            if (!conditionExist) {
                operator = '?';
                conditionExist = true;
            }
            url += `${operator}dueDate=${dueDate}`;
        }
        if (buyerCountry) {
            let operator = '&';
            if (!conditionExist) {
                operator = '?';
                conditionExist = true;
            }
            url += `${operator}buyerCountry=${buyerCountry}`;
        }
        if (deliveryCountry) {
            let operator = '&';
            if (!conditionExist) {
                operator = '?';
            }
            url += `${operator}deliveryCountry=${deliveryCountry}`;
        }
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                const resultJson: any[] = res.json();
                return resultJson.map(facetResponse => new Facet(facetResponse));
            })
            .catch(this.handleError);
    }

    public updateDemand(demand: Demand): Promise<any> {
        const url = catalogue_endpoint + `/demands/${demand.hjid}`;
        return this.http
            .put(url, demand, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .catch(this.handleError)
    }

    public deleteDemand(demandHjid: number): Promise<any> {
        let url = catalogue_endpoint + `/demands/${demandHjid}`;
        return this.http
            .delete(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .catch(this.handleError);
    }

    public createInterestActivity(demandHjid: number): Promise<any> {
        let url = catalogue_endpoint + `/demands/${demandHjid}/visit?visitorCompanyId=${this.cookieService.get('company_id')}`;
        return this.http
            .post(url, null, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

}
