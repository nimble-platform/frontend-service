import { Component, OnInit, Input } from "@angular/core";
import { UserService } from "./user.service";
import { ActivatedRoute} from "@angular/router";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../globals";
import * as moment from "moment";
import { CallStatus } from "../common/call-status";
import { CompanySettings } from "./model/company-settings";
import {selectValueOfTextObject} from '../common/utils';

@Component({
    selector: "company-details",
    templateUrl: "./company-details.component.html"
})
export class CompanyDetailsComponent implements OnInit {

	@Input() details: CompanySettings = null;
	@Input() hideTitle: boolean = false;
    imgEndpoint = myGlobals.user_mgmt_endpoint+"/company-settings/image/";
    initCallStatus: CallStatus = new CallStatus();

    selectValueOfTextObject = selectValueOfTextObject;

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

    formatDate(date:string) {
      return moment(date).format("YYYY-MM-DD");
    }

}
