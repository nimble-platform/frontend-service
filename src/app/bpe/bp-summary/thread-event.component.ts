/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";
import { BPDataService } from "../bp-view/bp-data-service";
import { ProcessInstanceGroup } from "../model/process-instance-group";
import { ThreadEventMetadata } from "../../catalogue/model/publish/thread-event-metadata";
import { BPEService } from "../bpe.service";
import { BpActivityEvent } from '../../catalogue/model/publish/bp-start-event';
import { BpUserRole } from '../model/bp-user-role';
import { TranslateService } from '@ngx-translate/core';
import { ActivityVariableParser } from '../bp-view/activity-variable-parser';
import { UserService } from '../../user-mgmt/user.service';
import {AppComponent} from '../../app.component';

@Component({
    selector: "thread-event",
    templateUrl: "./thread-event.component.html",
    styleUrls: ["./thread-event.component.css"]
})
export class ThreadEventComponent implements OnInit {

    @Input() processInstanceGroup: ProcessInstanceGroup;
    @Input() collaborationGroupId: string;
    @Input() event: ThreadEventMetadata;
    @Input() history: ThreadEventMetadata[] = [];
    @Output() processCancelled = new EventEmitter();

    correspondent: string = null;

    constructor(private bpDataService: BPDataService,
        private appComponent: AppComponent,
        private bpeService: BPEService,
        private userService: UserService,
        private translate: TranslateService) {
    }

    ngOnInit() {
        // get the correspondent if it's available
        if (this.event.correspondentUserIdFederationId) {
            this.userService
                .getPerson(this.event.correspondentUserIdFederationId[0], this.event.correspondentUserIdFederationId[1])
                .then(party => {
                    if (party && party.firstName && party.familyName) {
                        this.correspondent = party.firstName + " " + party.familyName;
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    openBpProcessView(updateProcess: boolean) {
        // whether we are updating the process instance or not
        this.event.isBeingUpdated = updateProcess;
        let userRole: BpUserRole = this.event.buyer ? "buyer" : "seller";

        let termsSources = [];

        let numberOfProducts = this.event.products.catalogIds.length;
        for (let i = 0; i < numberOfProducts; i++) {
            termsSources.push(null);
        }

        this.bpDataService.startBp(
            new BpActivityEvent(
                userRole,
                this.event.processType,
                this.processInstanceGroup.id,
                this.event,
                this.history,
                null,
                null,
                false,
                this.event.products.catalogIds,
                this.event.products.lineIds,
                this.event.processInstanceId,
                ActivityVariableParser.getPrecedingDocumentId(this.event.activityVariables),
                termsSources,
                this.event.sellerFederationId));
    }

    cancelBP() {
        this.appComponent.confirmModalComponent.open("Are you sure that you want to cancel this process?").then(result => {
            if(result){
                this.bpeService.cancelBusinessProcess(this.event.processInstanceId, this.processInstanceGroup.sellerFederationId)
                    .then(res => {
                        this.processCancelled.next();
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        });
    }

    // do not allow the user to update the request document if the event has some deleted products
    doesEventHaveDeletedProduct() {
        // if event.areProductsDeleted is not loaded yet, simply return true
        if (!this.event.areProductsDeleted) {
            return true;
        }
        for (let isProductDeleted of this.event.areProductsDeleted) {
            if (isProductDeleted) {
                return true;
            }
        }
        return false;
    }
}
