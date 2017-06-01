/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import * as myGlobals from '../globals';
import {GoodsItem} from "./model/publish/goods-item";
import {Catalogue} from "./model/publish/catalogue";
import {Identifier} from "./model/publish/identifier";
import {Party} from "./model/publish/party";
import {UserService} from "../user-mgmt/user.service";

@Injectable()
export class CatalogueService {
    private headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    private baseUrl = myGlobals.catalogue_endpoint;
    private catalogue: Catalogue;

    constructor(private http: Http,
                private userService: UserService) {
    }

    getCatalogue(userId: string): Promise<Catalogue> {
        // if the default catalogue is already fetched, return it
        if (this.catalogue == null) {

            // chain the promise for getting the user's party with the promise for getting the default catalogue
            // for the party
            return this.userService.getUserParty(userId).then(party => {

                // using the party query the default catalogue
                let url = this.baseUrl + `/catalogue/${party.hjid}/default`;
                return this.http
                    .get(url, {headers: this.headers})
                    .toPromise()
                    .then(res => {
                        if (res.status == 204) {
                            // no default catalogue yet, create new one
                            let id: Identifier = new Identifier("default", null, null);
                            // TODO not a sustainable solution. Find a solution between the synchronization of
                            // identity DB and catalogue DB
                            this.detachHjidsFromParty(party);
                            this.catalogue = new Catalogue(id, null, party, []);
                        } else {
                            this.catalogue = res.json() as Catalogue;
                        }
                        return this.catalogue;
                    })
                    .catch(this.handleError);
            });
        } else {
            return Promise.resolve(this.catalogue);
        }
    }

    postCatalogue(catalogue: Catalogue): Promise<Catalogue> {
        const url = this.baseUrl + `/catalogue`;
        return this.http
            .post(url, JSON.stringify(catalogue), {headers: this.headers})
            .toPromise()
            .then(res =>
                this.catalogue = res.json() as Catalogue
            )
            .catch(this.handleError);
    }

    putCatalogue(catalogue: Catalogue): Promise<Catalogue> {
        const url = this.baseUrl + `/catalogue`;
        return this.http
            .put(url, JSON.stringify(catalogue), {headers: this.headers})
            .toPromise()
            .catch(this.handleError);
    }

    publishProduct(goodsItem: GoodsItem): Promise<any> {
        const url = this.baseUrl + `/catalogue/product`;
        return this.http
            .post(url, JSON.stringify(goodsItem), {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    private detachHjidsFromParty(party:Party): void {
        let id:Identifier = new Identifier(party.hjid, null, null);
        party.id = id;
        party.hjid = null;
        party.partyName[0].hjid = null;
        party.person = null;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}