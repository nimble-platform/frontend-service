import { Component, OnInit, Input } from "@angular/core";
import { UserService } from "./user.service";
import { ActivatedRoute} from "@angular/router";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../globals";
import * as moment from "moment";
import { CallStatus } from "../common/call-status";
import { CompanySettings } from "./model/company-settings";
import { AppComponent } from "../app.component";
import {selectValueOfTextObject, sanitizeLink} from '../common/utils';

@Component({
    selector: "company-details",
    templateUrl: "./company-details.component.html"
})
export class CompanyDetailsComponent implements OnInit {

	@Input() details: CompanySettings = null;
	@Input() hideTitle: boolean = false;
  @Input() platformManagerMode: boolean = true;
    managementMode: boolean = false;
    imgEndpoint = myGlobals.user_mgmt_endpoint+"/company-settings/image/";
    initCallStatus: CallStatus = new CallStatus();
    vatCallStatus: CallStatus = new CallStatus();
    party : any = {};
    selectValueOfTextObject = selectValueOfTextObject;
    getLink = sanitizeLink;

    constructor(private cookieService: CookieService,
                private userService: UserService,
                private appComponent: AppComponent,
                public route: ActivatedRoute) {
    }

    ngOnInit() {
  		if(!this.details) {
  			this.initCallStatus.submit();
  			this.route.queryParams.subscribe(params => {
          const viewMode = params['viewMode'];
          const id = params['id'];
          if (viewMode && viewMode == 'mgmt') {
            this.managementMode = true;
          }
  				if (id) {
            this.party.partyId = id;
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
      else {
        this.party.partyId = this.details.companyID;
      }
    }

    validateVAT() {
      this.vatCallStatus.submit();
      this.userService.validateVAT(this.details.details.vatNumber)
        .then(response => {
          this.vatCallStatus.callback("VAT checked", true);
          setTimeout(function(){
            if (response.status == "success") {
              if (response.valid) {
                if (response.company_name) {
                  alert("The VAT is valid and registered for "+response.company_name+".");
                }
                else
                  alert("The VAT is valid.");
              }
              else {
                alert("The VAT is invalid.");
              }
            }
            else {
              alert("The VAT is invalid.");
            }
          },50);
        })
        .catch(error => {
            this.vatCallStatus.error("Error while checking VAT", error);
        });
    }

    formatDate(date:string) {
      return moment(date).format("YYYY-MM-DD");
    }

}
