/**
 * Copyright 2020
 * University of Bremen, Faculty of Production Engineering, Badgasteiner Straße 1, 28359 Bremen, Germany.
 * In collaboration with BIBA - Bremer Institut für Produktion und Logistik GmbH, Bremen, Germany.
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

/**
 * This is the Service File for the Explorative Search Component.
 * We Inject a simple HTTP GET Service which will perform a GET on
 * the User's keyword input to the backend server.
 * And return the response in JSON for further parsing.
 */

import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import * as myGlobals from '../globals';

import { CookieService } from 'ng2-cookies';

@Injectable()
export class ExplorativeSearchService {
    private langUrl = myGlobals.languageEndPoint;
    private url = myGlobals.endpoint;
    private logicalUrl = myGlobals.logicalViewEndpoint;
    private propEndPoint = myGlobals.propertyEndPoint;
    private sparqlEndPoint = myGlobals.sparqlEndPoint;
    private sparqlOptionEndPoint = myGlobals.sparqlOptionalSelectEndPoint;
    // SQP Endpoints
    private sqpButtonEndPoint = myGlobals.spqButton;
    private obsPropertySQP = myGlobals.obs_propFromConcept;
    private obsPropertyValuesSQP = myGlobals.obs_propValueFromConcept;
    private referenceFromConcept = myGlobals.referenceFromConcept;
    private sqpOrangeConcept = myGlobals.sqpOrangeConcept;

    private userLang: string;


    constructor(private http: Http,
                private cookieService: CookieService) { }

    getLanguageSupport(): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(this.langUrl, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }



    /**
     * This is where the HTTP GET service is performed for keyword search from user
     * @param term the keyword to be searched as string
     * @param lang language as string
     * @param user_id
     */
    searchData(term: string, lang: string, user_id: string): Promise<any> {
        this.userLang = lang;
        // console.log('Search term for language: ' + lang + ' and used backend url ' + this.url);
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        let input = {'keyword': term, 'language': this.userLang, 'userID': user_id};
        return this.http.get(`${this.url}?inputAsJson=${JSON.stringify(input)}`, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }


    getLogicalView(term: Object): Promise<any> {
        // console.log('From Service(logicalView', JSON.stringify(term));
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.post(this.logicalUrl, term, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getPropertyValues(term: Object): Promise<any> {
        // console.log('propvalue', term['language']);
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.propEndPoint}?inputAsJson=${JSON.stringify(term)}`, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getTableValues(term: Object): Promise<any> {
        // console.log('gettableview', term['language']);
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.sparqlEndPoint}?inputAsJson=${JSON.stringify(term)}`, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getOptionalSelect(term: Object): Promise<any> {
        // console.log('getoptselect', term['language']);
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.sparqlOptionEndPoint}?inputAsJson=${JSON.stringify(term)}`, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    //
    // Semantic Query Patterns API Call Handlers
    //

    getSQPButton(term: Object): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.sqpButtonEndPoint}?inputAsJson=${JSON.stringify(term)}`, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    searchForProperty(term: Object): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.obsPropertySQP}?inputAsJson=${JSON.stringify(term)}`, reqOptions)
            .toPromise()
            .then(res => res.json().outputForPropertiesFromConcept);
    }

    searchForPropertyValues(term: Object): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.obsPropertyValuesSQP}?inputAsJson=${JSON.stringify(term)}`, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getReferencesFromConcept(term: Object): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.referenceFromConcept}?inputAsJson=${JSON.stringify(term)}`, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getPropertyValuesFromOrangeGroup(term: Object): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.sqpOrangeConcept}?inputAsJson=${JSON.stringify(term)}`, reqOptions)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    /**
     * Error Handling for API Calls
     * @param error
     * @returns {Promise<any>}
     */

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
