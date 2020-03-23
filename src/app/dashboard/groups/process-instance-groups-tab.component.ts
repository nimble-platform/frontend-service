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
