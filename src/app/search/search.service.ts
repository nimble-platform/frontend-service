/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import * as myGlobals from '../globals';


@Injectable()
export class SearchService {
    private headers = new Headers({'Content-Type': 'application/json'});
  
    private url = myGlobals.endpoint;

    constructor(private http: Http) {
        this.headers.append('Access-Control-Allow-Origin','*');
        this.headers.append('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    }

    testConnection(){
        
        console.log ("Try to call web service: ....", null);
        const url = `http://127.0.0.1:8090/test`;
         var endResult ="";
        let text =  this.http.get(url, {headers: this.headers})
        console.log(text);
        text.toPromise()
        //output: 'First Example'
        .then(result => {
         endResult += result;
        });
    }
    
//    publishProduct(goodsItem: GoodsItem): Promise<any> {
//        //const url = `${this.url}/catalogue/product`;
//        // TODO remove the hardcoded URL
//        const url = `http://localhost:8095/catalogue/product`;
//        return this.http
//            .post(url, JSON.stringify(goodsItem), {headers: this.headers})
//            .toPromise()
//            .then(res => res.json())
//            .catch(this.handleError);
//    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}