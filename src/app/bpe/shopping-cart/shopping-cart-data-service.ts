/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Injectable } from '@angular/core';
import { Catalogue } from '../../catalogue/model/publish/catalogue';
import { CookieService } from 'ng2-cookies';
import { getAuthorizedHeaders } from '../../common/utils';
import * as myGlobals from '../../globals';
import { Http } from '@angular/http';
import { CatalogueLine } from '../../catalogue/model/publish/catalogue-line';
import { UBLModelUtils } from '../../catalogue/model/ubl-model-utils';
import { CategoryService } from '../../catalogue/category/category.service';

@Injectable()
export class ShoppingCartDataService {
    // the persisted catalogue storing the catalogue lines in the cart
    private cartCatalogue: Catalogue;

    private url = myGlobals.bpe_endpoint;
    private addCardBehaviour: string = myGlobals.config.addCartBehaviour;

    // service root category uris for the taxonomies. They are used to disable add cart button for services.
    serviceRootCategories: string[];

    constructor(private cookieService: CookieService,
        private categoryService: CategoryService,
        private http: Http) {
        this.fetchServiceRootCategories();
    }

    public addItemToCart(productHjid: string | number, quantity: number = 1, delegateId: string): Promise<Catalogue> {
        if (this.cartCatalogue == null) {
            return this.getShoppingCart().then(() => {
                return this.execAddItemToCart(productHjid, quantity, delegateId);
            });
        } else {
            return this.execAddItemToCart(productHjid, quantity, delegateId);
        }
    }

    private execAddItemToCart(productHjid: string | number, quantity: number = 1, delegateId: string): Promise<Catalogue> {
        let url = `${this.url}/shopping-cart?productId=${productHjid}&quantity=${quantity}`;
        let headers = getAuthorizedHeaders(this.cookieService);
        if (delegateId != null) {
            headers.append("federationId", delegateId);
        }
        return this.http
            .post(url, null, { headers: headers })
            .toPromise()
            .then(res => {
                this.cartCatalogue = res.json();
                return Promise.resolve(this.cartCatalogue);
            })
            .catch(error => {
                return this.handleError(error);
            });
    }

    public removeItemsFromCart(cartLineHjids: number[]): Promise<Catalogue> {
        let url = `${this.url}/shopping-cart?productIds=`;
        // append catalogue line hjids to the url
        let size = cartLineHjids.length;
        for (let i = 0; i < size; i++) {
            url += cartLineHjids[i];

            if (i != size - 1) {
                url += ",";
            }
        }
        return this.http
            .delete(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                for (let cartLineHjid of cartLineHjids) {
                    let indexToRemove = this.cartCatalogue.catalogueLine.findIndex(line => line.hjid === cartLineHjid);
                    this.cartCatalogue.catalogueLine.splice(indexToRemove, 1);
                }
                return Promise.resolve(this.cartCatalogue);
            })
            .catch(error => {
                return this.handleError(error);
            });
    }

    public cartFetched(): boolean {
        return this.cartCatalogue != null;
    }

    public async createShoppingCart(): Promise<Catalogue> {
        let url = `${this.url}/shopping-cart/new`;
        return this.http
            .post(url, null, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                this.cartCatalogue = res.json();
                return Promise.resolve(this.cartCatalogue);
            })
            .catch(error => {
                return this.handleError(error);
            });
    }

    public getShoppingCart(): Promise<Catalogue | null> {
        if (this.cartCatalogue != null) {
            return Promise.resolve(this.cartCatalogue);
        }

        let url = `${this.url}/shopping-cart`;
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                if (res.text() === '') {
                    return this.createShoppingCart();
                } else {
                    this.cartCatalogue = res.json();
                    return this.cartCatalogue;
                }
            })
            .catch(error => {
                return this.handleError(error);
            });
    }

    public isProductAddableToCart(catalogueId: string, productId: string): boolean {
        // do not add product to the cart if adding behaviour is single
        let inCart: boolean = UBLModelUtils.isProductInCart(this.cartCatalogue, catalogueId, productId);
        if (inCart && this.addCardBehaviour === 'single') {
            return false;
        }
        return true;
    }

    fetchServiceRootCategories(): void {
        this.categoryService.getServiceCategoriesForAvailableTaxonomies().then(result => {
            this.serviceRootCategories = result;
        })
    }

    isShoppingCartButtonVisible(categoryUris: string[]): boolean {
        if (this.serviceRootCategories == null || !this.cartFetched()) {
            return false;
        }

        for (let categoryUri of categoryUris) {
            if (this.serviceRootCategories.findIndex(serviceCategory => serviceCategory === categoryUri) !== -1) {
                return false;
            }
        }

        return true;
    }

    public resetData(): void {
        this.cartCatalogue = null;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
