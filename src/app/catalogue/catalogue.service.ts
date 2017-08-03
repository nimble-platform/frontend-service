/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from "@angular/core";
import {Headers, Http} from "@angular/http";
import * as myGlobals from "../globals";
import {GoodsItem} from "./model/publish/goods-item";
import {Catalogue} from "./model/publish/catalogue";
import {UserService} from "../user-mgmt/user.service";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {Category} from "./model/category/category";
import {Observable} from "rxjs/Observable";

@Injectable()
export class CatalogueService {
    private headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'});
    private baseUrl = myGlobals.catalogue_endpoint;

    private catalogue: Catalogue;
    private draftCatalogueLine: CatalogueLine;

    // To save a reference to the original version of the item being edited
    private originalCatalogueLine: CatalogueLine;

    constructor(private http: Http,
                private userService: UserService) {
    }

    getDraftItem(): CatalogueLine {
        return this.draftCatalogueLine;
    }

    setDraftItem(draftCatalogueLine: CatalogueLine): void {
        this.draftCatalogueLine = draftCatalogueLine;
    }

    getCatalogue(userId: string): Promise<Catalogue> {
        // if the default catalogue is already fetched, return it
        if (this.catalogue == null) {

            // chain the promise for getting the user's party with the promise for getting the default catalogue
            // for the party
            return this.userService.getUserParty(userId).then(party => {

                // using the party query the default catalogue
                let url = this.baseUrl + `/catalogue/${party.id}/default`;
                return this.http
                    .get(url, {headers: this.headers})
                    .toPromise()
                    .then(res => {
                        if (res.status == 204) {
                            // no default catalogue yet, create new one
                            this.catalogue = new Catalogue("default", null, party, "", "", []);
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

    downloadTemplate(category: Category): Observable<any> {
        const url = this.baseUrl + `/catalogue/template?taxonomyId=${category.taxonomyId}&categoryId=${encodeURIComponent(category.id)}`;
        let downloadTemplateHeaders = new Headers({'Accept': 'application/octet-stream'});
        return Observable.create(observer => {

            let xhr = new XMLHttpRequest();

            xhr.open('GET', this.baseUrl + `/catalogue/template?taxonomyId=${category.taxonomyId}&categoryId=${encodeURIComponent(category.id)}`, true);
            xhr.setRequestHeader('Accept', 'application/octet-stream');
            xhr.responseType = 'blob';

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {

                        var contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                        var blob = new Blob([xhr.response], {type: contentType});
                        observer.next(blob);
                        observer.complete();
                    } else {
                        observer.error(xhr.response);
                    }
                }
            }
            xhr.send();
        });
    }

    uploadTemplate(companyId: string, companyName: String, template: File): Observable<any> {

        const url = this.baseUrl + `/catalogue/template/upload?companyId=${companyId}&companyName=${companyName}`;
        return Observable.create(observer => {
            let formData: FormData = new FormData();
            formData.append("file", template, template.name);

            let xhr: XMLHttpRequest = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        //observer.next(JSON.parse(xhr.response));
                        observer.complete();
                    } else {
                        observer.error(xhr.response);
                    }
                }
            };

            xhr.open('POST', url, true);
            xhr.send(formData);

        });
    }

    uploadTemplate2(userId: string, template: File): Promise<any> {
        return this.userService.getUserParty(userId).then(party => {
            const url = this.baseUrl + `/catalogue/template/upload?companyId=${party.id}&companyName=${party.name}`;
            return new Promise<any>((resolve, reject) => {
                let formData: FormData = new FormData();
                formData.append("file", template, template.name);

                let xhr: XMLHttpRequest = new XMLHttpRequest();
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            //observer.next(JSON.parse(xhr.response));
                            resolve(xhr.response);
                        } else {
                            reject(xhr.status);
                        }
                    }
                };

                xhr.open('POST', url, true);
                xhr.send(formData);
            });
        });
    }

    resetData(): void {
        this.catalogue = null;
        this.draftCatalogueLine = null;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

    // Editing functionality
    getOriginalItem() {
        return this.originalCatalogueLine;
    }

    editCatalogueLine(catalogueLine: CatalogueLine) {
        // Deep copy to guard original catalogueLine model
        this.draftCatalogueLine = JSON.parse(JSON.stringify(catalogueLine));
        // save reference to original
        this.originalCatalogueLine = catalogueLine;
    }
}