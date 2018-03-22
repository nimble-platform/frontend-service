import {Component, OnInit} from "@angular/core";
import {AppComponent} from "../app.component";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {UserService} from "../user-mgmt/user.service";
import {BPDataService} from "../bpe/bp-view/bp-data-service";
import * as constants from '../constants';
import {ProcessInstanceGroup} from "../bpe/model/process-instance-group";
import {COLLABORATION_ROLE_BUYER, COLLABORATION_ROLE_SELLER} from "../constants";

@Component({
    selector: 'dashboard-threaded',
    templateUrl: './dashboard-threaded.component.html',
    styleUrls: ['./dashboard-threaded.component.css']
})

export class DashboardThreadedComponent implements OnInit {
    fullName = "";
    hasCompany = false;
    roles = [];
    alert1Closed = false;
    alert2Closed = false;

    groups: ProcessInstanceGroup[] = [];
    archived: boolean = false;
    page: number = 1;
    limit: number = 5;
    start: number;
    end: number;
    pageSize: number = 5;
    size: number;

    COLLABORATION_ROLE_BUYER: string = constants.COLLABORATION_ROLE_BUYER;
    COLLABORATION_ROLE_SELLER: string = constants.COLLABORATION_ROLE_SELLER;
    collaborationRole: string = constants.COLLABORATION_ROLE_SELLER;

    constructor(private cookieService: CookieService,
                private bpeService: BPEService,
                private bpDataService: BPDataService,
                private router: Router,
                private route: ActivatedRoute,
                private appComponent: AppComponent,
                private userService: UserService) {
    }

    ngOnInit() {
        if (this.cookieService.get("user_fullname"))
            this.fullName = this.cookieService.get("user_fullname");
        if (this.cookieService.get("user_id") && this.cookieService.get("company_id")) {

            if (this.cookieService.get("active_company_name")) {
                if (this.cookieService.get("active_company_name") == null || this.cookieService.get("active_company_name") == "null")
                    this.hasCompany = false;
                else
                    this.hasCompany = true;
            }
            else
                this.hasCompany = false;
        }
        else
            this.appComponent.checkLogin("/user-mgmt/login");
		if (this.cookieService.get('bearer_token')) {
			const at = this.cookieService.get('bearer_token');
			if (at.split(".").length == 3) {
				const at_payload = at.split(".")[1];
				try {
					const at_payload_json = JSON.parse(atob(at_payload));
					const at_payload_json_roles = at_payload_json["realm_access"]["roles"];
					this.roles = at_payload_json_roles;
				}
				catch(e){}
			}
		}
		else
			this.roles = [];


		// handle query parameters
        this.route.queryParams.subscribe(params => {
            // handle archived
            this.archived = params['arch'] == 'true' ? true : false;

            // handle collaboration role
            let passedCollaborationRole = params['cr'];
            if(passedCollaborationRole == null) {
                // if no collaboration role is passed and no previously role is available, assign to it seller
                if(this.collaborationRole == null) {
                    this.collaborationRole = COLLABORATION_ROLE_SELLER;
                } else {
                    // use the already set role
                }

            } else {
                if(passedCollaborationRole.toLowerCase() == 'buyer') {
                    this.collaborationRole = COLLABORATION_ROLE_BUYER;
                } else {
                    this.collaborationRole = COLLABORATION_ROLE_SELLER;
                }
            }

            // handle page
            let passedPage = params['pg'];
            if(passedPage == null) {
                if(this.page == null) {
                    this.page = 0;
                }

            } else {
                try {
                    this.page = Number.parseInt(passedPage)
                } catch(e) {
                    this.page = 0;
                }
            }

            this.retrieveProcessInstanceGroups();
        });
    }

    private onTabClick(event: any) {
        event.preventDefault();
        if (event.target.id == "salesTab") {
            this.collaborationRole = constants.COLLABORATION_ROLE_SELLER;
        } else {
            this.collaborationRole = constants.COLLABORATION_ROLE_BUYER;
        }
        this.filterChangeHandler();
    }

    filterChangeHandler(): void {
        this.router.navigate(['dashboard'], {queryParams: {pg: this.page, cr: this.collaborationRole, arch: this.archived}});
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
