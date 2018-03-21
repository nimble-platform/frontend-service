import {Component, Input, OnInit} from "@angular/core";
import {ProcessInstanceGroup} from "../bpe/model/process-instance-group";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";
import * as constants from '../constants';


/**
 * Created by suat on 19-Mar-18.
 */
@Component({
    selector: 'thread-list',
    templateUrl: './thread-list.component.html',
    styleUrls: ['./dashboard-threaded.component.css']
})

export class ThreadListComponent implements OnInit {
    COLLABORATION_ROLE_BUYER: string = constants.COLLABORATION_ROLE_BUYER;
    COLLABORATION_ROLE_SELLER: string = constants.COLLABORATION_ROLE_SELLER;

    @Input() collaborationRole: string;

    groups: ProcessInstanceGroup[] = [];
    archived: boolean = false;
    page: number = 1;
    limit: number = 5;
    start: number;
    end: number;
    pageSize: number = 5;
    size: number;

    constructor(private cookieService: CookieService,
                private bpeService: BPEService) {
    }

    ngOnInit(): void {
        this.retrieveProcessInstanceGroups();
    }

    retrieveProcessInstanceGroups(): void {
        this.bpeService.getProcessInstanceGroups(this.cookieService.get("company_id"), this.collaborationRole, this.page - 1, this.limit, this.archived)
            .then(response => {
                this.groups = response.processInstanceGroups;
                this.size = response.size;
                this.start = this.page * this.pageSize - this.pageSize + 1;
                this.end = this.start + this.size - 1;
            });
    }
}
