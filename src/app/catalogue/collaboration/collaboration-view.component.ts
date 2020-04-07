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

import {Component, OnInit} from "@angular/core";
import {CookieService} from 'ng2-cookies';
import {CollaborationService} from "./collaboration.service";
// import {CallStatus} from "../common/call-status";
import {ActivatedRoute, Params, Router} from "@angular/router";
// import { UserService } from "../user-mgmt/user.service";
// import { CompanySettings } from "../user-mgmt/model/company-settings";
// import {roundToTwoDecimals} from '../common/utils';
// import * as myGlobals from '../globals';
import { ProjectType } from './model/project-type';
import { ResourceListType } from './model/resourcelist-type';
import { ResourceType } from './model/resource-type';
import { CallStatus } from "../../common/call-status";
import { roundToTwoDecimals } from "../../common/utils";
import { CompanySettings } from "../../user-mgmt/model/company-settings";
import { UserService } from "../../user-mgmt/user.service";

@Component({
    selector: 'collaboration-view',
    templateUrl: './collaboration-view.component.html',
    styleUrls: ['./collaboration-view.component.css'],
    providers: [CookieService]
})

export class CollaborationViewComponent implements OnInit {

	tebugTextP1:string = "";

    callStatus = new CallStatus();
	roundToTwoDecimals = roundToTwoDecimals;
	selectedCurrency: any = "EUR";

	settings: CompanySettings;

	userToken: string = null;
    userEmail: string = null;
	projects: ProjectType[] = null;
	activeProject: string = "";
	resources: ResourceListType[] = null;
    activeResource: ResourceType = null;


    isModified: boolean = false;

    itemNote:string = "";

    constructor(private cookieService: CookieService,
                private collaborationService: CollaborationService,
                private userService: UserService,
                private route: ActivatedRoute,
                private router: Router) {

    }

    ngOnInit() {

		this.userToken = this.cookieService.get("bearer_token");
        this.userEmail = this.cookieService.get("user_email");
		this.collaborationService.getProjectList(this.userToken)
				.then((prjs) => {
					this.projects = prjs.projectList;
				});


    }

    onProjectSelected(): void {
		this.collaborationService.openProject(this.userToken, this.activeProject)
				.then((prjs) => {
					if (prjs=="OK"){
						this.collaborationService.getResources(this.userToken, this.activeProject)
								.then((res) => {
									this.resources = res.children;
									this.tebugTextP1 = "";
								});


					}
				});
	}

    onResourceClick(res): void {
		if (res!=null){
			this.collaborationService.getResourceItem(this.userToken, this.activeProject, res.name, res.version)
					.then((resItem) => {
						this.activeResource = resItem;
						this.itemNote = this.activeResource.notes;
						this.tebugTextP1 = "";
					});
		}
	}

	showResourceHistory(res): void{
		if (res!=null){
			this.collaborationService.getResourceHistory(this.userToken, this.activeProject, res.name)
					.then((resItem) => {
						res.children = resItem.children;
						this.tebugTextP1 = "";
					});
		}
	}

	onResourceHistoryClick(resH): void {
		if (resH!=null){
			this.collaborationService.getResourceItem(this.userToken, this.activeProject, resH.name, resH.version)
					.then((resItem) => {
						this.activeResource = resItem;
						this.itemNote = this.activeResource.notes;
						this.tebugTextP1 = "";
					});
		}
	}

	onUpdateResource(): void{
		if (this.itemNote != this.activeResource.notes){
			this.isModified = true;
		}
		else{
			this.isModified = false;
		}
	}

	isResourceModified(): boolean {
		return this.isModified;
	}

	updateResource(): void{
		var newResourceVersion = new ResourceType();
		newResourceVersion.projectName = this.activeResource.projectName;
		newResourceVersion.key = this.activeResource.key;
		newResourceVersion.name = this.activeResource.name;
		newResourceVersion.type = this.activeResource.type;
		newResourceVersion.ext = this.activeResource.ext;
		newResourceVersion.user	= this.userEmail;
		newResourceVersion.imageData = this.activeResource.imageData;
		newResourceVersion.season = this.activeResource.season;
		newResourceVersion.sector = this.activeResource.sector;
		newResourceVersion.composition = this.activeResource.composition;
		newResourceVersion.currency = this.activeResource.currency;
		newResourceVersion.price = this.activeResource.price;
		newResourceVersion.notes = this.itemNote;

		this.collaborationService.saveResourceItem(this.userToken, newResourceVersion)
				.then((result) => {
					if (result=="OK"){
						this.activeResource = null;
						this.collaborationService.getResources(this.userToken, this.activeProject)
								.then((res) => {
									this.resources = res.children;
									this.tebugTextP1 = "RESOURCE SAVED";
								});
					}
				});
	}


}
