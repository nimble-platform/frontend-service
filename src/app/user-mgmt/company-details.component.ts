import { Component, OnInit, Input } from "@angular/core";
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

	@Input() details: CompanySettings = null;
	@Input() hideTitle: boolean = false;
    initCallStatus: CallStatus = new CallStatus();

    constructor(private cookieService: CookieService,
                private userService: UserService,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
		if(!this.details) {
			this.initCallStatus.submit();
			this.route.queryParams.subscribe(params => {
				const id = params['id'];
				if (id) {
					this.userService.getSettingsForParty(id).then(details => {
						if (myGlobals.debug) {
							console.log("Fetched details: " + JSON.stringify(details));
						}
						this.details = details;
						this.initCallStatus.callback("Details successfully fetched", true);
					})
					.catch(error => {
						this.initCallStatus.error("Error while fetching company details", error);
					});
				}
			});
		}
    }

}
