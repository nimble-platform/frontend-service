/**
 * Created by suat on 17-May-17.
 */
import { Injectable } from "@angular/core";
import { Headers, Http } from "@angular/http";
import { catalogue_endpoint } from "../globals";
import { Catalogue } from "./model/publish/catalogue";
import { UserService } from "../user-mgmt/user.service";
import { CatalogueLine } from "./model/publish/catalogue-line";
import { Category } from "./model/category/category";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import {CookieService} from "ng2-cookies";
import { copy } from "../common/utils";
import {BinaryObject} from './model/publish/binary-object';

@Injectable()
export class CatalogueService {
    private headers = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
    private baseUrl = catalogue_endpoint;

    catalogue: Catalogue;
    draftCatalogueLine: CatalogueLine;
    // To save a reference to the original version of the item being edited
    originalCatalogueLine: CatalogueLine;
    // edit mode switch (observable as it is provided by parent to its grandchild components)
    private editMode = new BehaviorSubject<boolean>(false);
    editModeObs = this.editMode.asObservable();

    constructor(private http: Http,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    getCatalogueForceUpdate(userId: string, forceUpdate:boolean): Promise<Catalogue> {
        // if the default catalogue is already fetched, return it
        if (this.catalogue == null || forceUpdate == true) {

            // chain the promise for getting the user's party with the promise for getting the default catalogue
            // for the party
            return this.userService.getUserParty(userId).then(party => {

                // using the party query the default catalogue
                let url = this.baseUrl + `/catalogue/${party.id}/default`;
                return this.http
                    .get(url, {headers: this.getAuthorizedHeaders()})
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

    getCatalogue(userId: string): Promise<Catalogue> {
        return this.getCatalogueForceUpdate(userId, false);
    }

    getCatalogueLine(catalogueId:string, lineId:string):Promise<CatalogueLine> {
        const url = this.baseUrl + `/catalogue/${catalogueId}/catalogueline/${lineId}`;
        return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => {
                return res.json() as CatalogueLine;
            })
            .catch(this.handleError);
    }

    addCatalogueLine(catalogueId:string,catalogueLineJson:string){
        const url = this.baseUrl + `/catalogue/${catalogueId}/catalogueline`;
        return this.http
            .post(url,catalogueLineJson,{headers:this.getAuthorizedHeaders()})
            .toPromise()
            .catch(this.handleError);
    }

    updateCatalogueLine(catalogueId:string,catalogueLineJson:string){
        const url = this.baseUrl + `/catalogue/${catalogueId}/catalogueline`;
        return this.http
            .put(url,catalogueLineJson,{headers:this.getAuthorizedHeaders()})
            .toPromise()
            .catch(this.handleError);
    }

    postCatalogue(catalogue: Catalogue): Promise<Catalogue> {
        const url = this.baseUrl + `/catalogue/ubl`;
        return this.http
            .post(url, JSON.stringify(catalogue), {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res =>
                this.catalogue = res.json() as Catalogue
            )
            .catch(this.handleError);
    }

    putCatalogue(catalogue: Catalogue): Promise<Catalogue> {
        const url = this.baseUrl + `/catalogue/ubl`;
        return this.http
            .put(url, JSON.stringify(catalogue), {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .catch(this.handleError);
    }

    deleteCatalogue():Promise<any> {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const url = this.baseUrl + `/catalogue/ubl/${this.catalogue.uuid}`;
        return this.http
            .delete(url,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .catch(this.handleError);
    }

    downloadTemplate(userId:string, categories: Category[]): Promise<any> {
        let taxonomyIds:string = "", categoryIds:string = "";
        for(let category of categories) {
            categoryIds += category.id + ",";
            taxonomyIds += category.taxonomyId + ",";
        }
        categoryIds = categoryIds.substr(0, categoryIds.length-1);
        taxonomyIds = taxonomyIds.substr(0, taxonomyIds.length-1);

        return this.userService.getUserParty(userId).then(party => {
            const url = this.baseUrl + `/catalogue/template?partyId=${party.id}&partyName=${party.name}&categoryIds=${encodeURIComponent(categoryIds)}&taxonomyIds=${encodeURIComponent(taxonomyIds)}`;
            return new Promise<any>((resolve, reject) => {

                let xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.setRequestHeader('Accept', 'application/octet-stream');
                xhr.responseType = 'blob';

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {

                            var contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                            var blob = new Blob([xhr.response], {type: contentType});
                            let fileName = xhr.getResponseHeader("Content-Disposition").split("=")[1];
                            resolve({fileName: fileName, content: blob});
                        } else {
                            reject(xhr.status);
                        }
                    }
                }
                xhr.send();
            });
        });
    }

    uploadTemplate(userId: string, template: File, uploadMode:string): Promise<any> {
        const token = 'Bearer '+this.cookieService.get("bearer_token");

        return this.userService.getUserParty(userId).then(party => {
            const url = this.baseUrl + `/catalogue/template/upload?partyId=${party.id}&uploadMode=${uploadMode}`;
            return new Promise<any>((resolve, reject) => {
                let formData: FormData = new FormData();
                formData.append("file", template, template.name);

                let xhr: XMLHttpRequest = new XMLHttpRequest();
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 || xhr.status === 201) {
                            //observer.next(JSON.parse(xhr.response));
                            resolve(xhr.response);
                        } else {
                            reject(JSON.parse(xhr.response).message);
                        }
                    }
                };

                xhr.open('POST', url, true);
                xhr.setRequestHeader('Authorization', token);
                xhr.send(formData);
            });
        });
    }

    uploadZipPackage(pck:File): Promise<any> {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const url = this.baseUrl + `/catalogue/${this.catalogue.uuid}/image/upload`;
        return new Promise<any>((resolve, reject) => {
            let formData: FormData = new FormData();
            formData.append("package", pck, pck.name);

            let xhr: XMLHttpRequest = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else if(xhr.status === 400) {
                        reject(xhr.response);
                    } else {
                        reject(JSON.parse(xhr.response).message);
                    }
                }
            };

            xhr.open('POST', url, true);
            xhr.setRequestHeader('Authorization', token);
            xhr.send(formData);
        });
    }

    deleteCatalogueLine(catalogueId:string, lineId:string):Promise<any> {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const url = this.baseUrl + `/catalogue/${catalogueId}/catalogueline/${lineId}`;
        return this.http
            .delete(url,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => {
                let deletedLineIndex = this.catalogue.catalogueLine.findIndex(line => line.id == lineId);
                this.catalogue.catalogueLine.splice(deletedLineIndex, 1)
            })
            .catch(this.handleError);
    }

    downloadFile(uri:string){
        const url = this.baseUrl + `/binary-content?uri=${encodeURIComponent(uri)}`;
        return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => {
                return res.json() as BinaryObject;
            })
            .catch(this.handleError);
    }

    private getAuthorizedHeaders(): Headers {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
        return headers;
    }

    resetData(): void {
        this.catalogue = null;
        this.draftCatalogueLine = null;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

    // Editing functionality
    editCatalogueLine(catalogueLine: CatalogueLine) {
        // Deep copy to guard original catalogueLine model
        this.draftCatalogueLine = copy(catalogueLine);
        // save reference to original
        this.originalCatalogueLine = catalogueLine;
    }

    setEditMode(editMode:boolean):void {
        this.editMode.next(editMode);
    }
}
