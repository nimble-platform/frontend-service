import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {CookieService} from 'ng2-cookies';

@Injectable()
export class AnalyticsService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private url_plat = myGlobals.data_aggregation_endpoint;
    private url_comp = `${myGlobals.bpe_endpoint}/statistics`;

    constructor(
        private http: Http,
        private cookieService: CookieService
    ) {
    }

    getPlatAnalytics(): Promise<any> {
  		const url = `${this.url_plat}/`;
  		return this.http
  		.get(url, {headers: this.headers})
  		.toPromise()
  		.then(res => res.json())
  		.catch(this.handleError);
  	}

    getTradingVolumeTotal(status:string): Promise<any> {
      var url = `${this.url_comp}/trading-volume`;
      if (status != "")
        url = `${url}?status=${status}`;
      return this.http
  		.get(url, {headers: this.headers})
  		.toPromise()
  		.then(res => res.json())
  		.catch(this.handleError);
    }

    getTradingVolumeComp(comp:string,status:string): Promise<any> {
      var url = `${this.url_comp}/trading-volume?companyId=${comp}`;
      if (status != "")
        url = `${url}&status=${status}`;
      return this.http
  		.get(url, {headers: this.headers})
  		.toPromise()
  		.then(res => res.json())
  		.catch(this.handleError);
    }

    getNonOrdered(comp:string): Promise<any> {
      const url = `${this.url_comp}/non-ordered?companyId=${comp}`;
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
