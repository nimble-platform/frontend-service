import { Component, OnInit } from "@angular/core";
import { UserService } from "./user.service";
import { ActivatedRoute} from "@angular/router";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../globals";
import { CallStatus } from "../common/call-status";
import { CompanySettings } from "./model/company-settings";

@Component({
    selector: "company-details",
    templateUrl: "./company-details.component.html"
})
export class CompanyDetailsComponent implements OnInit {

    details: CompanySettings;
    initCallStatus: CallStatus = new CallStatus();

    constructor(private cookieService: CookieService,
                private userService: UserService,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
        this.initCallStatus.submit();
    		this.route.queryParams.subscribe(params => {
    			let id = params['id'];
    			if (id) {
    				this.userService.getSettingsForParty(id).then(details => {
    					if (myGlobals.debug) {
    						console.log("Fetched details: " + JSON.stringify(details));
    					}
    					this.details = details;
    					this.initCallStatus.callback("Details successfully fetched", true);
    				})
    				.catch(error => {
              this.details = null;
    					this.initCallStatus.error("Error while fetching company details", error);
    				});
    			}
    		});
    }

}
