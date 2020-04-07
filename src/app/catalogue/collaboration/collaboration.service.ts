/*
 * Copyright 2020
 * DOMINA - Organization and Logistics; Biella; Italy
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { Injectable } from "@angular/core";
import { Headers, Http } from "@angular/http";
import {CookieService} from "ng2-cookies";
import { ProjectListType } from './model/projectlist-type';
import { ResourceListType } from './model/resourcelist-type';
import { ResourceType } from './model/resource-type';
import { UserService } from "../../user-mgmt/user.service";
import { collaboration_endpoint } from "../../globals";

@Injectable()
export class CollaborationService {
    private headers = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
    private baseUrl = collaboration_endpoint;


    constructor(private http: Http,
                private userService: UserService,
                private cookieService: CookieService) {
    }


    getProjectList(strtoken:string):Promise<ProjectListType> {
        const url = this.baseUrl + `/projectList`;
		const params = { token: strtoken };

        return this.http
            .post(url, params)
            .toPromise()
            .then(res => {
                return res.json() as ProjectListType;
            })
            .catch(this.handleError);
    }

    openProject(strtoken:string, prjName:string):Promise<string> {
        const url = this.baseUrl + `/startCollaboration`;
		const params = { token: strtoken, projectName: prjName, url : null };

        return this.http
            .post(url, params)
            .toPromise()
            .then(res => {
                return res.statusText as string;
            })
            .catch(this.handleError);
    }

    getResources(strtoken:string, prjName:string):Promise<ResourceListType> {
        const url = this.baseUrl + `/resourceList`;
		const params = { token: strtoken, projectName: prjName, name : null };

        return this.http
            .post(url, params)
            .toPromise()
            .then(res => {
                return res.json() as ResourceListType;
            })
            .catch(this.handleError);
    }

    getResourceItem(strtoken:string, prjName:string, resName:string, version:number):Promise<ResourceType> {
        const url = this.baseUrl + `/getResource`;
		const params = { token: strtoken, projectName: prjName, resourceName : resName, resourceVersion: version };

        return this.http
            .post(url, params)
            .toPromise()
            .then(res => {
                return res.json() as ResourceType;
            })
            .catch(this.handleError);
    }

    getResourceHistory(strtoken:string, prjName:string, resName:string):Promise<ResourceListType> {
        const url = this.baseUrl + `/resourceHistory`;
		const params = { token: strtoken, projectName: prjName, name : resName};

        return this.http
            .post(url, params)
            .toPromise()
            .then(res => {
                return res.json() as ResourceListType;
            })
            .catch(this.handleError);
    }

    saveResourceItem(strtoken:string, res:ResourceType):Promise<string> {
        const url = this.baseUrl + `/saveResource`;
		const params = { token: strtoken, resource: res};

        return this.http
            .post(url, params)
            .toPromise()
            .then(res => {
                return res.statusText as string;
            })
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }



}
