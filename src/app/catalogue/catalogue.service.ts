/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import * as myGlobals from '../globals';
import {GoodsItem} from "./model/publish/goods-item";
import {Catalogue} from "./model/publish/catalogue";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {Identifier} from "./model/publish/identifier";
import {Party} from "./model/publish/party";

@Injectable()
export class CatalogueService {
    private headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    private baseUrl = myGlobals.catalogue_endpoint;
    private catalogue: Catalogue;

    constructor(private http: Http) {
    }

    getCatalogue(): Promise<Catalogue> {
        if (this.catalogue == null) {
            //const url = `${this.url}/catalogue/product`;
            // TODO remove the hardcoded URL and get the party id properly
            let partyId = 'pid';
            const url = this.baseUrl + `/catalogue/${partyId}/default`;
            return this.http
                .get(url, {headers: this.headers})
                .toPromise()
                .then(res => {
                    if (res.status == 204) { // no default catalogue yet
                        let id: Identifier = new Identifier("default", null, null);
                        let partyId = new Identifier("party_id", null, null);
                        let party: Party = new Party(partyId, "party_name");
                        this.catalogue = new Catalogue(id, null, party, []);
                    } else {
                        this.catalogue = res.json() as Catalogue;
                    }
                    return this.catalogue;
                })
                .catch(this.handleError);
        } else {
            return Promise.resolve(this.catalogue);
        }
    }

    postCatalogue(catalogue: Catalogue): Promise<Catalogue> {
        //const url = `${this.url}/catalogue/product`;
        // TODO remove the hardcoded URL and get the party id properly
        let partyId = 'pid';
        const url = this.baseUrl + `/catalogue?partyId=${partyId}`;
        return this.http
            .post(url, JSON.stringify(catalogue), {headers: this.headers})
            .toPromise()
            .then(res =>
                this.catalogue = res.json() as Catalogue
            )
            .catch(this.handleError);
    }

    publishProduct(goodsItem: GoodsItem): Promise<any> {
        //const url = `${this.url}/catalogue/product`;
        // TODO remove the hardcoded URL
        const url = this.baseUrl + `/catalogue/product`;
        return this.http
            .post(url, JSON.stringify(goodsItem), {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}