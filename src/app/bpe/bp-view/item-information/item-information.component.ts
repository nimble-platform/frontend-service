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

import {Component, OnInit} from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { Router } from "@angular/router";

@Component({
    selector: "item-information",
    templateUrl: "./item-information.component.html",
    styleUrls: ["./item-information.component.css"]
})
export class ItemInformationComponent implements OnInit {

    constructor(private bpDataService: BPDataService,
                private router: Router) {

    }

    ngOnInit() {
        if(this.bpDataService.bpActivityEvent.userRole == null) {
            this.router.navigate(['dashboard']);
        }
    }

    shouldShowResponse(): boolean {
        let isResponseSent = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.processStatus == 'Completed';
        let collaborationCancelled = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.collaborationStatus == 'CANCELLED';

        return isResponseSent || (!!this.bpDataService.itemInformationResponse && !collaborationCancelled);
    }
}
