/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {class_label} from '../globals';
import {map} from 'rxjs/operators';
import {CookieService} from 'ng2-cookies';
import {DEFAULT_LANGUAGE, FEDERATION, LANGUAGES} from '../catalogue/model/constants';


@Injectable()
export class SimpleSearchService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private url = myGlobals.indexing_service_endpoint;
    private delegate_url = myGlobals.delegate_endpoint;
    private facetMin = myGlobals.facet_min;
    private facetCount = myGlobals.facet_count;
    private eFactoryIndexingEndpoint = myGlobals.eFactory_indexing_endpoint

    private delegated = (FEDERATION() == 'ON');

    product_name = myGlobals.product_name;
    product_vendor_id = myGlobals.product_vendor + '.' + myGlobals.product_vendor_id;
    product_vendor_name = myGlobals.product_vendor + '.' + myGlobals.product_vendor_name;
    product_img = myGlobals.product_img;
    product_nonfilter_full = myGlobals.product_nonfilter_full;
    product_nonfilter_regex = myGlobals.product_nonfilter_regex;
    product_nonfilter_data_type = myGlobals.product_nonfilter_data_type;
    party_filter_main = myGlobals.party_filter_main;
    party_filter_trust = myGlobals.party_filter_trust;
    product_configurable = myGlobals.product_configurable;
    product_cat = myGlobals.product_cat;
    product_cat_mix = myGlobals.product_cat_mix;

    constructor(private http: Http,
                private cookieService: CookieService) {
    }

    // this service retrieves the ubl properties and quantity properties for the given idx fields
    getUblAndQuantityProperties(idxFields: string[]) {
        let url = this.url + `/property/search`;
        let fq = 'nameSpace:"http://www.nimble-project.org/resource/ubl#"';
        if (idxFields.length != 0) {
            fq += ' OR (valueQualifier: "QUANTITY" AND (' + idxFields.map(idxField => 'idxField:"' + idxField + '"').join(' OR ') + '))';
        }
        let searchObject: any = {};
        searchObject.rows = 2147483647;
        searchObject.start = 0;
        searchObject.q = '*:*';
        searchObject.fq = [];
        searchObject.fq.push(fq);
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getFields(): Promise<any> {
        let url = this.url + `/item/fields`;
        if (this.delegated) {
            url = this.delegate_url + `/item/fields`;
        }
        // const url = `${this.url}/select?q=*:*&rows=0&wt=csv`;
        return this.http
            .get(url, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getCompFields(): Promise<any> {
        let url = this.url + `/party/fields`;
        if (this.delegated) {
            url = this.delegate_url + `/party/fields`;
        }
        // const url = `${this.url}/select?q=*:*&rows=0&wt=csv`;
        return this.http
            .get(url, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    get(query: string, facets: string[], facetQueries: string[], page: number, rows: number, sort: string, cat: string, catID: string, search_index: string): Promise<any> {
        let queryRes;
        let searchObject: any = {};
        if (search_index == 'Category') {
            let classLabel = myGlobals.class_label;
            let querySettings = {
                'fields': ['commodityClassficationUri', classLabel],
                'boosting': false,
                'boostingFactors': {}
            };
            queryRes = this.buildQueryString(query, querySettings, true, true, true);
        } else {
            queryRes = this.buildQueryString(query, myGlobals.query_settings, true, true, true);
        }

        const facetIndex: number = facets.findIndex(f => f === 'certificateCode');
        if (facetIndex != -1) {
            facets.splice(facetIndex, 1);
        }
        searchObject.sort = [];
        sort = sort.replace('{LANG}', DEFAULT_LANGUAGE());
        searchObject.sort.push(sort);
        query = queryRes.queryStr;
        let url = this.url + `/item/search`;
        if (this.delegated) {
            url = this.delegate_url + `/item/search`;
        }
        searchObject.rows = rows;
        searchObject.start = page - 1;
        searchObject.q = query;
        for (let facet of facets) {
            if (facet.length === 0 || !facet.trim()) {
            } else {
                if (searchObject.facet == null) {
                    searchObject.facet = {};
                    searchObject.facet.field = [];
                    searchObject.facet.minCount = this.facetMin;
                    searchObject.facet.limit = this.facetCount;
                }
                searchObject.facet.field.push(facet)
            }
        }
        for (let facetQuery of facetQueries) {
            if (searchObject.fq == null) {
                searchObject.fq = [];
            }
            searchObject.fq.push(facetQuery);
        }
        if (cat != '') {
            var add_url = `${this.product_cat_mix}:"${catID}"`;
            if (searchObject.fq == null) {
                searchObject.fq = [];
            }
            searchObject.fq.push(add_url);
        }
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getComp(query: string, facets: string[], facetQueries: string[], page: number, rows: number, sort: string, search_index: string, pageRef?: string, unverified?: boolean, forceLocal?: boolean): Promise<any> {
        let searchObject: any = {};
        searchObject.rows = rows;
        searchObject.start = page - 1;
        searchObject.sort = [];
        sort = sort.replace('{LANG}', DEFAULT_LANGUAGE());

        const facetIndex: number = facets.findIndex(f => f === 'certificateCode');
        if (facetIndex != -1) {
            facets.splice(facetIndex, 1);
        }

        let url = null;
        // when the page reference is catalogue, we retrieve eFactory companies for white/black list
        if (pageRef == 'catalogue' || pageRef == 'network' || pageRef == 'offering') {
            url = this.eFactoryIndexingEndpoint + `/party/search`;
            searchObject.q = 'hasRegisteredUser:true';
            searchObject.fq = [];
            // EFPF companies might not have lowercaseLegalName field, so, replace it with legalName
            sort = sort.replace("lowercaseLegalName","legalName");
        }
        else {
            let queryRes;
            if (search_index == 'Name') {
                queryRes = this.buildQueryString(query, myGlobals.query_settings_comp, true, false);
            } else if (search_index == 'Business Keywords') {
                let querySettings = {
                    'fields': ['{LANG}_businessKeywords'],
                    'boosting': false,
                    'boostingFactors': {}
                };
                queryRes = this.buildQueryString(query, querySettings, true, true);
            }
            query = queryRes.queryStr;
            url = this.url + `/party/search`;
            let local = false;
            if (forceLocal) {
                local = forceLocal;
            }
            if (this.delegated && !local) {
                url = this.delegate_url + `/party/search`;
            }
            searchObject.q = query;
            for (let facet of facets) {
                if (facet.length === 0 || !facet.trim()) {
                } else {
                    if (searchObject.facet == null) {
                        searchObject.facet = {};
                        searchObject.facet.field = [];
                        searchObject.facet.minCount = this.facetMin;
                        searchObject.facet.limit = this.facetCount;
                    }
                    searchObject.facet.field.push(facet)
                }
            }
            for (let facetQuery of facetQueries) {
                if (searchObject.fq == null) {
                    searchObject.fq = [];
                }
                searchObject.fq.push(facetQuery);
            }
            if (searchObject.fq == null) {
                searchObject.fq = [];
            }
            if (unverified) {
                searchObject.fq.push('verified:false');
            } else {
                searchObject.fq.push('verified:true');
            }
        }
        searchObject.sort.push(sort);
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getEFactoryCompanies(vatNumbers: string[]) {
        let vatNumbersParam = [];
        vatNumbers.forEach(vatNumber => vatNumbersParam.push('vatNumber:"' + vatNumber + '"'));

        let searchObject: any = {};
        searchObject.rows = vatNumbers.length;
        searchObject.start = 0;
        searchObject.sort = [];
        let url = this.eFactoryIndexingEndpoint + `/party/search`;
        searchObject.q = 'hasRegisteredUser:true AND (' + vatNumbersParam.join(' OR ') + ')';
        searchObject.fq = [];
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getSuggestions(query: string, item_field: string, search_index: string) {
        let querySettings = {
            'fields': [item_field],
            'boosting': false,
            'boostingFactors': {}
        };
        let queryRes = this.buildQueryString(query, querySettings, true, true, search_index != 'Category');
        let url = this.url + `/item/search`;
        if (this.delegated) {
            url = this.delegate_url + `/item/search`;
        }
        if (search_index == 'Category') {
            url = this.url + `/class/search`;
        }
        let searchObject: any = {};
        searchObject.rows = 0;
        searchObject.q = queryRes.queryStr;
        searchObject.facet = {};
        searchObject.facet.field = [];
        searchObject.facet.limit = -1;
        searchObject.facet.minCount = 1;
        searchObject.rows = 2147483647;
        searchObject.start = 0;
        searchObject.sort = ['score desc'];

        for (let i = 0; i < queryRes.queryFields.length; i++) {
            searchObject.facet.field.push(queryRes.queryFields[i]);
        }
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .pipe(
                map(response =>
                    this.getSuggestionArray(response.json(), query, queryRes.queryArr, queryRes.queryFields, search_index)
                )
            );
    }

    getCompSuggestions(query: string, item_field: string[], pageRef?: string, forceLocal?: boolean, verified?:boolean) {
        let querySettings = {
            'fields': item_field,
            'boosting': false,
            'boostingFactors': {}
        };
        let searchObject: any = {};
        searchObject.facet = {};
        searchObject.facet.field = [];
        searchObject.facet.limit = -1;
        searchObject.facet.minCount = 1;
        searchObject.rows = 2147483647;
        searchObject.start = 0;
        searchObject.sort = ['score desc'];
        searchObject.fq = [];
        let url = null;
        let queryRes = this.buildQueryString(query, querySettings, true, true);
        // when the page reference is catalogue, we retrieve suggestions for eFactory companies
        if (pageRef == 'catalogue' || pageRef == 'network' || pageRef == 'offering') {
            url = this.eFactoryIndexingEndpoint + `/party/search`;
            searchObject.q = 'hasRegisteredUser:true AND ' + queryRes.queryStr;
        } else {
            url = this.url + `/party/search`;
            let local = false;
            if (forceLocal) {
                local = forceLocal;
            }
            if (this.delegated && !local) {
                url = this.delegate_url + `/party/search`;
            }
            searchObject.q = queryRes.queryStr;
            if (verified) {
                searchObject.fq.push('verified:true');
            }
        }

        for (let i = 0; i < queryRes.queryFields.length; i++) {
            searchObject.facet.field.push(queryRes.queryFields[i]);
        }
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .pipe(
                map(response =>
                    this.getSuggestionArray(response.json(), query, queryRes.queryArr, queryRes.queryFields)
                )
            );
    }

    getClassSuggestions(query: string, field: string, ontology: string) {
        let querySettings = {
            'fields': [field],
            'boosting': false,
            'boostingFactors': {}
        };
        let queryRes = this.buildQueryString(query, querySettings, true, true);
        const url = this.url + `/class/search`
        let searchObject: any = {};
        searchObject.rows = 0;
        searchObject.q = '(' + queryRes.queryStr + ')';
        if (ontology != '') {
            let ontologyPrefixSimpleArr = ontology.split('/');
            let ontologyPrefixSimple = ontologyPrefixSimpleArr[ontologyPrefixSimpleArr.length - 1];
            ontologyPrefixSimple.replace('#', '');
            searchObject.q += ' AND nameSpace:*' + ontologyPrefixSimple + '*';
        }
        searchObject.facet = {};
        searchObject.facet.field = [];
        searchObject.facet.limit = -1;
        for (let i = 0; i < queryRes.queryFields.length; i++) {
            searchObject.facet.field.push(queryRes.queryFields[i]);
        }
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .pipe(
                map(response =>
                    this.getSuggestionArray(response.json(), query, queryRes.queryArr, queryRes.queryFields)
                )
            );
    }

    // the format for the field is "{LANG}_label"
    getCategoryUris(categories: any, field: string, label: string) {
        let uris = [];
        let languageId = field.substring(0, field.indexOf('_'));
        for (let category of categories) {
            if (category.label[languageId] && category.label[languageId] === label) {
                uris.push(category['uri']);
            }
        }
        return uris;
    }

    getSuggestionArray(res: any, q: string, qA: string[], fields: string[], search_index: string = null): string[] {
        var suggestions = [];
        var suggestionsTmp = [];
        var suggestionsCount = [];
        if (q.length >= 2 && res.facets) {
            for (let i = 0; i < fields.length; i++) {
                let field = fields[i];
                if (res.facets[field] && res.facets[field].entry && res.facets[field].entry.length > 0) {
                    for (let sug of res.facets[field].entry) {
                        if (sug['label']) {
                            let label = sug['label'];
                            if (suggestionsTmp.indexOf(label) == -1) {
                                suggestionsTmp.push(label);
                                suggestionsCount.push({
                                    'label': label,
                                    'count': 0,
                                    'uris': search_index === 'Category' ? this.getCategoryUris(res.result, field, label) : null
                                });
                            }
                        }
                    }
                }
            }
            for (let i = 0; i < suggestionsCount.length; i++) {
                let fullLabel = suggestionsCount[i].label.toLowerCase();
                ;
                for (let j = 0; j < qA.length; j++) {
                    var idx = fullLabel.indexOf(qA[j].toLowerCase());
                    if (idx != -1) {
                        if (j == 0) {
                            suggestionsCount[i].count += 9999;
                        } else {
                            suggestionsCount[i].count += (qA[j].length) * 50;
                            suggestionsCount[i].count += (qA.length - j) * 20;
                            suggestionsCount[i].count -= Math.min(Math.round(idx / 2), 20);
                        }
                    }
                }
            }
            suggestionsCount = suggestionsCount.sort(function (a, b) {
                return b.count - a.count;
            });
            for (let i = 0; i < Math.min(suggestionsCount.length, 10); i++) {
                if (suggestionsCount[i].count > 0) {
                    // suggestion list contains labels and uris for category search
                    if (search_index === 'Category') {
                        suggestions.push({
                            'label': suggestionsCount[i].label,
                            'uris': suggestionsCount[i].uris
                        })
                    } else {
                        suggestions.push(suggestionsCount[i].label);
                    }
                }
            }
        }
        return suggestions;
    }

    // considerWhiteBlackList indicates whether we handle white/black list functionality in the search
    buildQueryString(query: string, qS: any, full: boolean, allLang: boolean, considerWhiteBlackList: boolean = false): any {
        let companyVAT = this.cookieService.get('vat');
        // if the VAT number is equal to the empty string, change it to "undefined", otherwise, the backend assumes that it as a real VAT number which is not true.
        if(companyVAT === ""){
            companyVAT = undefined;
        }
        if (query == '*') {
            return {
                'queryStr': considerWhiteBlackList ? `permittedParties:${companyVAT} OR (-permittedParties:[* TO *] AND (*:* -restrictedParties:${companyVAT} ) )` : '*',
                'queryArr': [],
                'queryFields': []
            };
        }
        //query = query.replace(/[!'()]/g, '');
        query = this.escapeLucene(query);
        query = this.escapeLogic(query);
        query = query.trim();
        let splitQuery = [];
        if (full) {
            splitQuery = query.split(' ');
        }
        let queryArr = [query];
        let queryStr = '';
        let queryFields = [];
        let negativeBoosts = [];
        for (let i = 0; i < qS.fields.length; i++) {
            let field = qS.fields[i];
            if (field.indexOf('{LANG}') != -1) {
                queryFields.push(field.replace('{LANG}', 'en'));
                if (qS.boosting && qS.boostingFactors && qS.boostingFactors[field]) {
                    qS.boostingFactors[field.replace('{LANG}', 'en')] = qS.boostingFactors[field];
                    if (qS.boostingFactors[field] < 0) {
                        negativeBoosts.push(field.replace('{LANG}', 'en'));
                    }
                }
                if (allLang) {
                    for (let j = 0; j < LANGUAGES.length; j++) {
                        if (LANGUAGES[j] != 'en') {
                            queryFields.push(field.replace('{LANG}', LANGUAGES[j]));
                            if (qS.boosting && qS.boostingFactors && qS.boostingFactors[field]) {
                                qS.boostingFactors[field.replace('{LANG}', LANGUAGES[j])] = qS.boostingFactors[field];
                                if (qS.boostingFactors[field] < 0) {
                                    negativeBoosts.push(field.replace('{LANG}', LANGUAGES[j]));
                                }
                            }
                        }
                    }
                } else if (DEFAULT_LANGUAGE() != 'en') {
                    queryFields.push(field.replace('{LANG}', DEFAULT_LANGUAGE()));
                    if (qS.boosting && qS.boostingFactors && qS.boostingFactors[field]) {
                        qS.boostingFactors[field.replace('{LANG}', DEFAULT_LANGUAGE())] = qS.boostingFactors[field];
                        if (qS.boostingFactors[field] < 0) {
                            negativeBoosts.push(field.replace('{LANG}', DEFAULT_LANGUAGE()));
                        }
                    }
                }
            } else {
                queryFields.push(field);
                if (qS.boosting && qS.boostingFactors && qS.boostingFactors[field] && qS.boostingFactors[field] < 0) {
                    negativeBoosts.push(field);
                }
            }
        }
        for (let i = 0; i < splitQuery.length; i++) {
            splitQuery[i] = splitQuery[i].replace(/ /g, '');
            if (splitQuery[i].length >= 2) {
                if (queryArr.indexOf(splitQuery[i]) == -1) {
                    queryArr.push(splitQuery[i]);
                }
                let allLower = splitQuery[i].toLowerCase();
                if (queryArr.indexOf(allLower) == -1) {
                    queryArr.push(allLower);
                }
                let allUpper = splitQuery[i].toUpperCase();
                if (queryArr.indexOf(allUpper) == -1) {
                    queryArr.push(allUpper);
                }
                let firstCapital = allLower.substring(0, 1).toUpperCase() + '' + allLower.substring(1, allLower.length);
                if (queryArr.indexOf(firstCapital) == -1) {
                    queryArr.push(firstCapital);
                }
            }
        }
        for (let i = 0; i < queryArr.length; i++) {
            for (let j = 0; j < queryFields.length; j++) {
                if (queryFields[j] != 'STANDARD') {
                    queryStr += queryFields[j] + ':*' + queryArr[i] + '*';
                } else {
                    if (negativeBoosts.length > 0) {
                        queryStr += '(*' + queryArr[i] + '* ';
                        for (let k = 0; k < negativeBoosts.length; k++) {
                            queryStr += 'AND ((' + negativeBoosts[k] + ':* -*' + queryArr[i] + '*) OR (-' + negativeBoosts[k] + ':[* TO *] AND *:*)) ';
                        }
                        queryStr += ')';
                    } else {
                        queryStr += '*' + queryArr[i] + '*';
                    }
                }
                if (qS.boosting && queryFields[j] != class_label) {
                    queryStr += '^' + Math.abs(qS.boostingFactors[queryFields[j]]);
                }

                queryStr += ' ';
            }
        }
        if (considerWhiteBlackList) {
            queryStr = '(' + queryStr + ')' + ` AND (permittedParties:${companyVAT} OR (-permittedParties:[* TO *] AND (*:* -restrictedParties:${companyVAT} ) ))`;
        }
        return {
            'queryStr': queryStr,
            'queryArr': queryArr,
            'queryFields': queryFields
        };
    }

    escapeLogic(value) {
        value = value.replace(/ AND /g, ' * ');
        value = value.replace(/ OR /g, ' * ');
        value = value.replace(/ NOT /g, ' * ');
        return value;
    }

    escapeLucene(value) {
        // TODO: Solr does not handle the parenthesis in the join queries. Remove them for now.
        value = value.replace(/[()]/g, '');
        var specials = ['+', '-', '&', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '\\'];
        var regexp = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
        return value.replace(regexp, '\\$1');
    }

    /**
     * Checks whether a facet should be shown on the UI
     * @param field
     * @param prefix
     * @param facetMetadata
     */
    isFieldDisplayed(field: string, prefix: string = '', facetMetadata: any = null): boolean {
        if (field == this.product_name || field == this.product_img || field == this.product_vendor_id || field == this.product_cat || field == this.product_cat_mix) {
            return false;
        }
        for (let filter of this.product_nonfilter_full) {
            if (field == filter) {
                return false;
            }
        }
        for (let filter of this.product_nonfilter_regex) {
            if (field.search(filter) != -1) {
                return false;
            }
        }
        for (let filter of this.product_configurable) {
            if (field.search(filter) != -1) {
                return false;
            }
        }
        if (facetMetadata != null && this.product_nonfilter_data_type.length > 0 && this.product_nonfilter_data_type.indexOf(facetMetadata.dataType) != -1) {
            let genName = field;
            if (genName.indexOf(DEFAULT_LANGUAGE() + '_') != -1) {
                genName = genName.replace(DEFAULT_LANGUAGE() + '_', '');
            } else if (genName.indexOf('{NULL}_') != -1) {
                genName = genName.replace('{NULL}_', '');
            } else if (genName.indexOf(prefix + '_') == 0) {
                genName = genName.replace('_', '');
            }
            // data type restriction only applies to fields which are not included in the main/trust filters of the party
            if (this.party_filter_main.indexOf(genName) == -1 && this.party_filter_trust.indexOf(genName) == -1) {
                return false;
            }
        }
        return true;
    }

    private getHeadersWithBasicAuthorization(): Headers {
        const headers = new Headers();
        this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
        headers.append('Authorization', 'Basic ' + btoa('admin:*platform*'));
        return headers;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

    getCompanies(query: string, facets: string[], rowCount: number): Promise<any> {
        query = query.replace(/[!'()]/g, '');
        // var start = page*10-10;
        let url = this.url + `/party/search`;
        if (this.delegated) {
            url = this.delegate_url + `/party/search`;
        }

        const facetIndex: number = facets.findIndex(f => f === 'certificateCode');
        if (facetIndex != -1) {
            facets.splice(facetIndex, 1);
        }

        let searchObject: any = {};
        searchObject.rows = rowCount;

        searchObject.q = query;

        var full_url = url + '';
        for (let facet of facets) {
            if (facet.length === 0 || !facet.trim()) {
            } else {
                //full_url += "&facet.field=" + facet;
                if (searchObject.facet == null) {
                    searchObject.facet = {};
                    searchObject.facet.field = [];
                    searchObject.facet.minCount = this.facetMin;
                    searchObject.facet.limit = this.facetCount;
                }
                searchObject.facet.field.push(facet)
            }
        }

        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }


    getFavouriteSearch(query: string, facets: string[], page?: number, sortType?: string): Promise<any> {
        query = query;
        let url = this.url + `/item/search`;
        if (this.delegated) {
            url = this.delegate_url + `/item/search`;
        }
        let searchObject: any = {};
        searchObject.rows = 10;
        searchObject.start = page - 1;
        searchObject.q = query;
        searchObject.sort = [];
        let currency = myGlobals.config.standardCurrency;
        let currentFirstLower = currency.charAt(0).toLowerCase() + currency.slice(1);
        if (sortType === 'PRICE_HIGH_TO_LOW') {
            searchObject.sort.push(currentFirstLower + '_price desc');
        } else {
            searchObject.sort.push(currentFirstLower + '_price asc');
        }
        for (let facet of facets) {
            if (facet.length === 0 || !facet.trim()) {
            } else {
                if (searchObject.facet == null) {
                    searchObject.facet = {};
                    searchObject.facet.field = [];
                    searchObject.facet.minCount = this.facetMin;
                    searchObject.facet.limit = this.facetCount;
                }
                searchObject.facet.field.push(facet)
            }
        }
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get('bearer_token')
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getCompanyBasedProductsAndServices(query: string, facets: string[], facetQueries: string[], page: number, cat: string, catID: string): Promise<any> {
        // let queryRes = this.buildQueryString(query,myGlobals.query_settings,true,false);
        // query = queryRes.queryStr;
        const url = this.url + `/item/search`
        let searchObject: any = {};
        searchObject.rows = 10;
        searchObject.start = page - 1;
        searchObject.q = query;
        for (let facet of facets) {
            if (facet.length === 0 || !facet.trim()) {
            } else {
                if (searchObject.facet == null) {
                    searchObject.facet = {};
                    searchObject.facet.field = [];
                    searchObject.facet.minCount = this.facetMin;
                    searchObject.facet.limit = this.facetCount;
                }
                searchObject.facet.field.push(facet)
            }
        }
        for (let facetQuery of facetQueries) {
            if (searchObject.fq == null) {
                searchObject.fq = [];
            }
            searchObject.fq.push(facetQuery);
        }
        if (cat != "") {
            var add_url = `${this.product_cat_mix}:"${catID}"`;
            if (searchObject.fq == null) {
                searchObject.fq = [];
            }
            searchObject.fq.push(add_url);
        }
        return this.http
            .post(url, searchObject, {
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.cookieService.get("bearer_token")
                })
            })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }
}
