import {Component, OnInit} from "@angular/core";
import {AppComponent} from "../app.component";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";
import {Router} from "@angular/router";
import {UserService} from "../user-mgmt/user.service";
import {BPDataService} from "../bpe/bp-view/bp-data-service";
import {ProcessInstanceGroup} from "../bpe/model/process-instance-group";
import {COLLABORATION_ROLE_BUYER, COLLABORATION_ROLE_SELLER} from "./thread-summary.component";

@Component({
    selector: 'dashboard-threaded',
    templateUrl: './dashboard-threaded.component.html',
    styleUrls: ['./dashboard-threaded.component.css']
})

export class DashboardThreadedComponent implements OnInit {
    COLLABORATION_TYPE_SALE = 'Sale';
    COLLABORATION_TYPE_PURCHASE = 'Purchase';

    fullName = "";
    hasCompany = false;
    roles = [];
    alert1Closed = false;
    alert2Closed = false;

    collaborationType:string = this.COLLABORATION_TYPE_SALE;
    seller_history: ProcessInstanceGroup[] = [];
    buyer_history: ProcessInstanceGroup[] = [];


    constructor(private cookieService: CookieService,
                private bpeService: BPEService,
                private bpDataService: BPDataService,
                private router: Router,
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
            this.getProcessInstanceGroups();
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
    }

    getProcessInstanceGroups() {
        this.bpeService.getProcessInstanceGroups(this.cookieService.get("company_id"), COLLABORATION_ROLE_SELLER)
            .then(processInstanceGroups => {
                this.seller_history = processInstanceGroups;
            });
        this.bpeService.getProcessInstanceGroups(this.cookieService.get("company_id"), COLLABORATION_ROLE_BUYER)
            .then(processInstanceGroups => {
                this.buyer_history = processInstanceGroups;
            });
    }

    private onTabClick(event: any) {
        event.preventDefault();
        if (event.target.id == "salesTab") {
            this.collaborationType = this.COLLABORATION_TYPE_SALE;
        } else {
            this.collaborationType = this.COLLABORATION_TYPE_PURCHASE;
        }
    }
}
