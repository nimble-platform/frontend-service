/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
 * UB - University of Bremen, Faculty of Production Engineering; Bremen; Germany
 * BIBA - Bremer Institut für Produktion und Logistik GmbH; Bremen; Germany
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import {catalogue_endpoint, catalogue_endpoint_with_zuul, config, delegate_endpoint} from '../globals';
import {Catalogue} from './model/publish/catalogue';
import {UserService} from '../user-mgmt/user.service';
import {CatalogueLine} from './model/publish/catalogue-line';
import {Category} from './model/category/category';
import {CookieService} from 'ng2-cookies';
import {copy} from '../common/utils';
import {BinaryObject} from './model/publish/binary-object';
import {CataloguePaginationResponse} from './model/publish/catalogue-pagination-response';
import {UBLModelUtils} from './model/ubl-model-utils';
import {DEFAULT_LANGUAGE, FEDERATION} from './model/constants';
import {Clause} from './model/publish/clause';

@Injectable()
export class CatalogueService {
    private headers = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
    private baseUrl = catalogue_endpoint;

    private delegate_url = delegate_endpoint;

    private delegated = (FEDERATION() == "ON");

    catalogueResponse: CataloguePaginationResponse;
    draftCatalogueLine: CatalogueLine;
    // To save a reference to the original version of the item being edited
    originalCatalogueLine: CatalogueLine;

    constructor(private http: Http,
        private userService: UserService,
        private cookieService: CookieService) {
    }

    getCatalogueResponse(userId: string, categoryName: string = null, searchText: string = null, limit: number = 0, offset: number = 0, sortOption = null, catalogueId = "default",productStatus=null): Promise<CataloguePaginationResponse> {
        return this.userService.getUserParty(userId).then(party => {

            let url = this.baseUrl + `/catalogue/${UBLModelUtils.getPartyId(party)}/pagination?catalogueId=${catalogueId}&limit=${limit}&offset=${offset}`;
            // if there is a selected category to filter the results, then add it to the url
            if (categoryName) {
                url += `&categoryName=${categoryName}`;
            }
            // if there is a search text, append it to the end of the url. Also, default language id is added.
            if (searchText) {
                url += `&searchText=${searchText}&languageId=${DEFAULT_LANGUAGE()}`
            }
            if (sortOption) {
                url += `&sortOption=${sortOption}`;
            }
            if (productStatus) {
                url += `&status=${productStatus}`;
            }
            return this.http
                .get(url, { headers: this.getAuthorizedHeaders() })
                .toPromise()
                .then(res => {
                    this.catalogueResponse = res.json() as CataloguePaginationResponse;
                    let sorted = this.sortImages(res, "catalogueLines", true);
                    return sorted as CataloguePaginationResponse;
                    //return this.catalogueResponse;
                })
                .catch(res => {
                    if (res.status == 404) {
                        // no default catalogue yet, create new one
                        this.catalogueResponse = new CataloguePaginationResponse(null, 0, []);
                        return this.catalogueResponse;
                    } else {
                        this.handleError(res.getBody());
                    }
                });
        })
    }

    getCatalogueLinesByHjids(hjids: number[], limit = 0, offset = 0, sortOption = null): Promise<any> {
        let url = this.baseUrl + `/cataloguelines?limit=${limit}&offset=${offset}&ids=${hjids}`;
        if (this.delegated) {
            url = this.delegate_url + `/cataloguelines?limit=${limit}&offset=${offset}&ids=${hjids}`;
        }
        if (sortOption) {
            url += `&sortOption=${sortOption}`;
        }

        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                return res.json() as Array<CatalogueLine>;
            })
            .catch(res => {
                this.handleError(res.getBody());
            });
    }

    getCatalogueLine(catalogueId: string, lineId: string): Promise<CatalogueLine> {
        let url = this.baseUrl + `/catalogue/${catalogueId}/catalogueline?lineId=${encodeURIComponent(lineId)}`;
        if (this.delegated) {
            url = this.delegate_url + `/catalogue/${catalogueId}/catalogueline?lineId=${encodeURIComponent(lineId)}`;
        }
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                let sorted = this.sortImages(res, null, false);
                return sorted as CatalogueLine;
                //return res.json() as CatalogueLine;
            })
            .catch(this.handleError);
    }


    getCatalogueLineByHjid(hjId: string): Promise<CatalogueLine> {
        const url = this.baseUrl + `/catalogueline/${hjId}`;
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                let sorted = this.sortImages(res, null, false);
                return sorted as CatalogueLine;
                //return res.json() as CatalogueLine;
            })
            .catch(this.handleError);
    }

    getLinesForDifferentCatalogues(catalogueIds: string[], lineIds: string[], delegateId: string): Promise<CatalogueLine[]> {
        let url = this.baseUrl + `/catalogue/cataloguelines`;
        // append catalogue line ids to the url
        let catalogueUuidsParam = "?catalogueUuids=";
        if (this.delegated) {
            url = this.delegate_url + `/catalogue/cataloguelines?delegateId=${delegateId}`;
            catalogueUuidsParam = "&catalogueUuids=";
        }

        let lineIdsParam = "&lineIds=";
        let size = lineIds.length;
        for (let i = 0; i < size; i++) {

            lineIdsParam += encodeURIComponent(lineIds[i]);
            catalogueUuidsParam += catalogueIds[i];

            if (i != size - 1) {
                lineIdsParam += ",";
                catalogueUuidsParam += ",";
            }
        }
        url += catalogueUuidsParam + lineIdsParam;
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                let sorted = this.sortImages(res, null, true);
                return sorted as CatalogueLine[];
                //return res.json() as CatalogueLine[];
            })
            .catch(this.handleError);
    }

    areProductsValid(catalogueIds: string[], lineIds: string[], delegateId: string): Promise<any> {
        let url = this.baseUrl + `/catalogue/cataloguelines/valid`;
        // append catalogue line ids to the url
        let catalogueUuidsParam = "?catalogueUuids=";
        if (this.delegated) {
            url = this.delegate_url + `/catalogue/cataloguelines/valid?delegateId=${delegateId}`;
            catalogueUuidsParam = "&catalogueUuids=";
        }

        let lineIdsParam = "&lineIds=";
        let size = lineIds.length;
        for (let i = 0; i < size; i++) {

            lineIdsParam += encodeURIComponent(lineIds[i]);
            catalogueUuidsParam += catalogueIds[i];

            if (i != size - 1) {
                lineIdsParam += ",";
                catalogueUuidsParam += ",";
            }
        }
        url += catalogueUuidsParam + lineIdsParam;
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getCatalogueLines(catalogueId: string, lineIds: string[]): Promise<CatalogueLine[]> {
        let url = this.baseUrl + `/catalogue/${catalogueId}/cataloguelines`;
        // append catalogue line ids to the url
        let size = lineIds.length;
        for (let i = 0; i < size; i++) {
            if (i == 0) {
                url += "?lineIds=";
            }

            url += encodeURIComponent(lineIds[i]);

            if (i != size - 1) {
                url += ",";
            }
        }
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                let sorted = this.sortImages(res, null, true);
                return sorted as CatalogueLine[];
                //return res.json() as CatalogueLine[];
            })
            .catch(this.handleError);
    }

    addCatalogueLine(catalogueId: string, catalogueLineJson: string) {
        const url = this.baseUrl + `/catalogue/${catalogueId}/catalogueline`;
        return this.http
            .post(url, catalogueLineJson, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }

    offerCatalogsOrLines(catalogueUuids:string[],lineIds:string[],vatNumbers:string[],offerDetails:string) {
        let url = this.baseUrl + `/catalogue/cataloguelines/offer`;

        let catalogueUuidsParam = "?catalogueUuids=" + catalogueUuids.join();
        let vatNumbersParam = "&vats=" + vatNumbers.join();
        url += catalogueUuidsParam  + vatNumbersParam;
        if(lineIds && lineIds.length > 0){
            let lineIdsParam = "&lineIds=" + lineIds.map(lineId => encodeURIComponent(lineId)).join();
            url += lineIdsParam;
        }
        return this.http
            .post(url, offerDetails, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }

    updateCatalogueLine(catalogueId: string, catalogueLineJson: string) {
        const url = this.baseUrl + `/catalogue/${catalogueId}/catalogueline`;
        return this.http
            .put(url, catalogueLineJson, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }

    addBlackWhiteListToCatalog(catalogueId: string, blackList: string[], whiteList: string[]) {
        const url = this.baseUrl + `/catalogue/${catalogueId}/white-black-list?blackList=${blackList.join(",")}&whiteList=${whiteList.join(",")}`;
        return this.http
            .put(url, null,{ headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }

    hidePriceForCatalogue(catalogueId: string, hidden:boolean) {
        const url = this.baseUrl + `/catalogue/${catalogueId}/hide-price?hidden=${hidden}`;
        return this.http
            .put(url, null,{ headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }
    postCatalogue(catalogue: Catalogue): Promise<Catalogue> {
        const url = this.baseUrl + `/catalogue/ubl`;
        return this.http
            .post(url, JSON.stringify(catalogue), { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }

    deleteCatalogues(catalogueIds: string[]): Promise<any> {
        const partyId = this.cookieService.get("company_id");
        let ids: string = '';
        for (let id of catalogueIds) {
            ids += id + ","
        }
        ids = ids.substr(0, ids.length - 1);
        const url = this.baseUrl + `/catalogue?partyId=${partyId}&ids=${ids}`;
        return this.http
            .delete(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }

    downloadTemplate(userId: string, categories: Category[], templateLanguage: string): Promise<any> {
        let taxonomyIds: string = "", categoryIds: string = "";
        for (let category of categories) {
            categoryIds += category.id + ",";
            taxonomyIds += category.taxonomyId + ",";
        }
        categoryIds = categoryIds.substr(0, categoryIds.length - 1);
        taxonomyIds = taxonomyIds.substr(0, taxonomyIds.length - 1);

        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const url = this.baseUrl + `/catalogue/template?categoryIds=${encodeURIComponent(categoryIds)}&taxonomyIds=${encodeURIComponent(taxonomyIds)}&templateLanguage=${templateLanguage}`;
        return new Promise<any>((resolve, reject) => {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Accept', 'application/octet-stream');
            xhr.setRequestHeader('Authorization', token);
            xhr.responseType = 'blob';

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {

                        var contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                        var blob = new Blob([xhr.response], { type: contentType });
                        let fileName = xhr.getResponseHeader("Content-Disposition").split("=")[1];
                        resolve({ fileName: fileName, content: blob });
                    } else {
                        reject(xhr.status);
                    }
                }
            }
            xhr.send();
        });
    }

    uploadTemplate(userId: string, template: File, uploadMode: string, catalogueId: string): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");

        return this.userService.getUserParty(userId).then(party => {
            let url = this.baseUrl + `/catalogue/template/upload?partyId=${UBLModelUtils.getPartyId(party)}&uploadMode=${uploadMode}&includeVat=${config.vatEnabled}`;
            url += `&catalogueId=${catalogueId}`;
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
                            reject(xhr.response);
                        }
                    }
                };

                xhr.open('POST', url, true);
                xhr.setRequestHeader('Authorization', token);
                xhr.send(formData);
            });
        });
    }

    uploadImageZipPackage(pck: File, catalogueId: string = this.catalogueResponse.catalogueId): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const partyId = this.cookieService.get("company_id");
        // adding zuul prefix to be able to upload large files by bypassing the Spring DispatcherServlet
        // https://projects.spring.io/spring-cloud/spring-cloud.html#_uploading_files_through_zuul
        const url = catalogue_endpoint_with_zuul + `/catalogue/${catalogueId}/image/upload?partyId=${partyId}`;
        return new Promise<any>((resolve, reject) => {
            let formData: FormData = new FormData();
            formData.append("package", pck, pck.name);

            let xhr: XMLHttpRequest = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                let response: any = {};
                // the operation completed
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        response.status = xhr.status;
                        response.message = "Image package uploaded successfully.";
                        resolve(response);
                    } else if (xhr.status == 504) {
                        response.status = xhr.status;
                        response.message = "Images uploaded but still being processed. They will be visible once the processing is done.";
                        resolve(response);
                    } else {
                        reject(xhr.response);
                    }
                }
            };

            xhr.open('POST', url, true);
            xhr.setRequestHeader('Authorization', token);
            xhr.setRequestHeader('Transfer-Encoding', 'chunked');
            xhr.send(formData);
        });
    }

    exportCatalogues(catalogueIds: string[]): Promise<any> {
        const partyId = this.cookieService.get("company_id");
        let ids: string = '';
        for (let id of catalogueIds) {
            ids += id + ","
        }
        ids = ids.substr(0, ids.length - 1);
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const languageId = DEFAULT_LANGUAGE();
        const url = this.baseUrl + `/catalogue/export?ids=${ids}&languageId=${languageId}&partyId=${partyId}`;
        return new Promise<any>((resolve, reject) => {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Accept', 'application/zip');
            xhr.setRequestHeader('Authorization', token);
            xhr.responseType = 'blob';

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {

                        var contentType = 'application/zip';
                        var blob = new Blob([xhr.response], { type: contentType });
                        // file name
                        let fileName = catalogueIds[0];
                        if (catalogueIds.length > 1) {
                            fileName = 'catalogues';
                        }
                        fileName = fileName + '_' + new Date().toString() + ".zip";

                        resolve({ fileName: fileName, content: blob });
                    } else {
                        reject(xhr.status);
                    }
                }
            }
            xhr.send();
        });
    }

    downloadBOMTemplate(): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const url = this.baseUrl + `/lcpa/bom-template`;
        return new Promise<any>((resolve, reject) => {

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Accept', 'application/octet-stream');
            xhr.setRequestHeader('Authorization', token);
            xhr.responseType = 'blob';

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {

                        var contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                        var blob = new Blob([xhr.response], { type: contentType });
                        let fileName = xhr.getResponseHeader("Content-Disposition").split("=")[1];
                        resolve({ fileName: fileName, content: blob });
                    } else {
                        reject(xhr.status);
                    }
                }
            }
            xhr.send();
        });
    }

    deleteCatalogueLine(catalogueId: string, lineId: string): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const url = this.baseUrl + `/catalogue/${catalogueId}/catalogueline?lineId=${encodeURIComponent(lineId)}`;
        return this.http
            .delete(url, { headers: new Headers({ "Authorization": token }) })
            .toPromise()
            .catch(this.handleError);
    }

    deleteAllProductImagesInsideCatalogue(catalogueIds: string[]): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const partyId = this.cookieService.get("company_id");
        let ids: string = '';
        for (let id of catalogueIds) {
            ids += id + ","
        }
        ids = ids.substr(0, ids.length - 1);
        const url = this.baseUrl + `/catalogue/delete-images?ids=${ids}&partyId=${partyId}`;
        return this.http
            .get(url, { headers: new Headers({ "Authorization": token }) })
            .toPromise()
            .catch(this.handleError);
    }

    getContractForCatalogue(catalogueUuids: string[]): Promise<Map<string,Clause[]>> {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        let url = this.baseUrl + `/catalogue/contract?catalogueUuids=${catalogueUuids.join()}`;
        if (this.delegated) {
            url = this.delegate_url + `/catalogue/contract?catalogueUuids=${catalogueUuids.join()}`;
        }
        return this.http
            .get(url, { headers: new Headers({ "Authorization": token }) })
            .toPromise()
            .then(res => {
                return res.json() as Map<string,Clause[]>;
            })
            .catch(this.handleError);
    }

    setContractForCatalogue(catalogueUuid: string, clauses:Clause[]): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const url = this.baseUrl + `/catalogue/${catalogueUuid}/contract`;
        return this.http
            .post(url,clauses, { headers: new Headers({ "Authorization": token }) })
            .toPromise()
            .catch(this.handleError);
    }

    getBinaryObject(uri: string) {
        const url = this.baseUrl + `/binary-content?uri=${encodeURIComponent(uri)}`;
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                return res.json() as BinaryObject;
            })
            .catch(this.handleError);
    }

    getBinaryObjects(uris: string[]) {
        let url = null;
        if (this.delegated) {
            let encodedUris = [];
            for (let uri of uris) {
                encodedUris.push(encodeURIComponent(uri))
            }
            url = this.delegate_url + `/binary-contents?uris=${encodedUris}`;
        }
        else {
            let condition: string = "";
            for (let uri of uris) {
                condition += uri + ","
            }
            url = this.baseUrl + `/binary-contents?uris=${encodeURIComponent(condition)}`;
        }
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                return res.json() as BinaryObject[];
            })
            .catch(this.handleError);
    }

    getCatalogueIdsForParty() {
        const partyId = this.cookieService.get("company_id");
        const url = this.baseUrl + `/catalogue/ids/${partyId}`;
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                return res.json();
            })
            .catch(this.handleError);

    }

    getCatalogueIdsUUidsForParty() {
        const partyId = this.cookieService.get("company_id");
        const url = this.baseUrl + `/catalogue/idsuuids/${partyId}`;
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                return res.json();
            })
            .catch(this.handleError);

    }

    getCatalogueFromUuid(Uuid: string) {
        let url = this.baseUrl + `/catalogue/ubl/${Uuid}`;
        if (this.delegated) {
            url = this.delegate_url + `/catalogue/ubl/${Uuid}`;
        }
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                return this.sortImages(res, "catalogueLine", true);
            })
            .catch(this.handleError);
    }

    /**
     * Retrieves the catalogue identifiers for the catalogue filter using the catalogue uuids
     * @param uuids
     */
    getCatalogueIds(uuids: string[]): Promise<any> {
        let url = this.baseUrl + `/catalogue/ids?catalogueUuids=${encodeURIComponent(uuids.join(','))}`;
        return this.http
            .get(url, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .then(res => {
                // transform the result in the form of [{'uuid':'x', 'id':'y'}] to {'x':'y'}
                const resp = {};
                res.json().forEach(pair => resp[pair.uuid] = pair.id);
                return resp;
            })
            .catch(this.handleError);
    }

    /**
     * Sends a request (as a mail) for catalogue exchange to the catalog provider
     * @param uuid the uuid of catalogue to be requested for the exchange
     * @param requestDetails the details of catalogue exchange request as text
     */
    requestCatalogueExchange(uuid: string,requestDetails:string): Promise<any> {
        let url = this.baseUrl + `/catalogue/exchange?catalogueUuid=${encodeURIComponent(uuid)}`;
        return this.http
            .post(url, requestDetails, { headers: this.getAuthorizedHeaders() })
            .toPromise()
            .catch(this.handleError);
    }

    getTaxRates(): Promise<any> {
        const url = `https://raw.githubusercontent.com/ibericode/vat-rates/master/vat-rates.json`;
        return this.http
            .get(url, {})
            .toPromise()
            .then(res => {
                return res.json();
            })
            .catch(this.handleError);
    }

    private getAuthorizedHeaders(): Headers {
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({ 'Authorization': token });
        this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
        return headers;
    }

    resetData(): void {
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

    sortImages(data: any, start: string, array: boolean): any {
        let dataTmp = data.json();
        let dataTmpInner = dataTmp;
        if (dataTmp) {
            if (start)
                dataTmpInner = dataTmp[start];
            if (array) {
                for (let i = 0; i < dataTmpInner.length; i++) {
                    dataTmpInner[i] = this.sortImagesInner(dataTmpInner[i]);
                }
            }
            else {
                dataTmpInner = this.sortImagesInner(dataTmpInner);
            }
            if (start)
                dataTmp[start] = dataTmpInner;
        }
        return dataTmp;
    }

    sortImagesInner(data: any) {
        let dataTmp = data;
        if (dataTmp && dataTmp.goodsItem && dataTmp.goodsItem.item && dataTmp.goodsItem.item.productImage && dataTmp.goodsItem.item.productImage.length > 1) {
            dataTmp.goodsItem.item.productImage = dataTmp.goodsItem.item.productImage.sort(function(a, b) {
                let a_comp = a.hjid;
                let b_comp = b.hjid;
                return a_comp - b_comp;
            });
        }
        return dataTmp;
    }
}
