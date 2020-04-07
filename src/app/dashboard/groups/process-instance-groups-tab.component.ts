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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DashboardQueryParameters} from '../model/dashboard-query-parameters';
import {CollaborationGroupResults} from '../model/collaboration-group-results';
import {CallStatus} from '../../common/call-status';
import {ProcessInstanceGroupFilter} from '../../bpe/model/process-instance-group-filter';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {BPEService} from '../../bpe/bpe.service';
import {CookieService} from 'ng2-cookies';
import {DashboardQuery} from '../model/dashboard-query';
import {FEDERATION, FEDERATIONID} from '../../catalogue/model/constants';
import {PAGE_SIZE, TABS} from '../constants';
import {FederatedCollaborationGroupMetadata} from '../../bpe/model/federated-collaboration-group-metadata';
import * as myGlobals from '../../globals';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CollaborationGroup} from '../../bpe/model/collaboration-group';
import {DashboardUser} from '../model/dashboard-user';
import {deepEquals} from '../../common/utils';
import {AppComponent} from '../../app.component';
@Component({
    selector: 'process-instance-groups-tab',
    templateUrl: './process-instance-groups-tab.component.html'
})
export class ProcessInstanceGroupsTabComponent {

    constructor() {}

    /**
     * init methods
     */

    ngOnInit() {
    }

    /**
     * event handlers
     */


    /**
     * selectors for the template
     */


    /**
     * internal logic
     */

}
