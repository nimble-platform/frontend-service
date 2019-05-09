import {Injectable} from '@angular/core';
import {getAuthorizedHeaders} from '../../common/utils';
import {Headers, Http} from '@angular/http';
import {CookieService} from 'ng2-cookies';
import * as myGlobals from '../../globals';

@Injectable()
export class LogisticPublishingService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private baseUrl = myGlobals.catalogue_endpoint;
    private url = myGlobals.indexing_service_endpoint;

    constructor(private http: Http,
                private cookieService: CookieService) {
    }

    getLogisticRelatedServices(taxonomyId:string):Promise<any>{
        const url = `${this.baseUrl}/taxonomies/${taxonomyId}/logistics-services`;
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                return res.json();
            })
            .catch(this.handleError);
    }

    getProperty(uri:string){
        let url = this.url + `/property?uri=${encodeURIComponent(uri)}`;
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getPropertyCodeList(uri:string){
        const url = this.url + `/code/select?q=codedList:"${encodeURIComponent(uri)}"`;
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

}
