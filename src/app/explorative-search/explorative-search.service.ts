/**
 * This is the Service File for the Explorative Search Component.
 * We Inject a simple HTTP GET Service which will perform a GET on
 * the User's keyword input to the backend server.
 * And return the response in JSON for further parsing.
 */

import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
// import {Observable} from 'rxjs/Observable';
// import {SearchItem} from './model/SearchItem';

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
    private headers = new Headers();


    constructor(private http: Http) { }

    getLanguageSupport(): Promise<any> {
        return this.http.get(this.langUrl)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }
    // This is where the HTTP GET service is performed
    // for keyword search from user
    searchData(term: string, lang: string, user_id: string): Promise<any> {
        this.userLang = lang;
        // console.log('Search term for language: ' + lang + ' and used backend url ' + this.url);
        let input = {'keyword': term, 'language': this.userLang, 'userID': user_id};
        return this.http.get(`${this.url}?inputAsJson=${JSON.stringify(input)}`)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    /*getLogicalView(term: Object): Promise<any> {
        console.log('getlogicalview', term['language']);
        return this.http.get(`${this.logicalUrl}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(err => console.log(err));
    }*/
    getLogicalView(term: Object): Promise<any> {
        // console.log('From Service(logicalView', JSON.stringify(term));
        this.headers.append('Content-Type', 'application/json; charset=UTF-8');
        return this.http.post(this.logicalUrl, term, new RequestOptions({ headers: this.headers }))
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getPropertyValues(term: Object): Promise<any> {
        // console.log('propvalue', term['language']);
        return this.http.get(`${this.propEndPoint}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getTableValues(term: Object): Promise<any> {
        // console.log('gettableview', term['language']);
        return this.http.get(`${this.sparqlEndPoint}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getOptionalSelect(term: Object): Promise<any> {
        // console.log('getoptselect', term['language']);
        return this.http.get(`${this.sparqlOptionEndPoint}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    //
    // Semantic Query Patterns API Call Handlers
    //

    getSQPButton(term: Object): Promise<any> {
        return this.http.get(`${this.sqpButtonEndPoint}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    searchForProperty(term: Object): Promise<any> {
        return this.http.get(`${this.obsPropertySQP}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json().outputForPropertiesFromConcept);
    }

    searchForPropertyValues(term: Object): Promise<any> {
        return this.http.get(`${this.obsPropertyValuesSQP}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getReferencesFromConcept(term: Object): Promise<any> {
        return this.http.get(`${this.referenceFromConcept}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getPropertyValuesFromOrangeGroup(term: Object): Promise<any> {
        return this.http.get(`${this.sqpOrangeConcept}?inputAsJson=${JSON.stringify(term)}`)
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
