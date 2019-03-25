import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { AppComponent } from "../../app.component";
import { CookieService } from "ng2-cookies";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as myGlobals from '../../globals';
import {selectValueOfTextObject, createTextObject} from '../../common/utils';
import { FormBuilder, FormGroup, FormControl } from "@angular/forms";
import { AddressSubForm } from "../subforms/address.component";
import { CallStatus } from "../../common/call-status";
import { UserService } from "../user.service";
import { DashboardUser } from "../../dashboard/model/dashboard-user";

@Component({
    selector: "company-data-settings",
    templateUrl: "./company-data-settings.component.html"
})
export class CompanyDataSettingsComponent implements OnInit {

    @Input() settings: CompanySettings;
    dataForm: FormGroup;
    mailto: string;
    tooltipHTML: string;
    config = myGlobals.config;
    alertClosed = false;
    forceActText = false;
    saveCallStatus: CallStatus = new CallStatus();
    @Output() onSaveEvent: EventEmitter<void> = new EventEmitter();

    selectValueOfTextObject = selectValueOfTextObject;
    user: DashboardUser;

    constructor(private appComponent: AppComponent,
                private _fb: FormBuilder,
                private modalService: NgbModal,
                private cookieService: CookieService,
                private userService: UserService) {

    }

    ngOnInit() {
      this.dataForm = this._fb.group({
          name: new FormControl({value: (this.selectValueOfTextObject(this.settings.details.legalName) || ""), disabled: !this.appComponent.checkRoles('pm')}),
          brandName: new FormControl({value: (this.selectValueOfTextObject(this.settings.details.brandName) || ""), disabled: (!this.appComponent.checkRoles('pm') && Object.keys(this.settings.details.brandName).length == 0)}),
          vatNumber: new FormControl({value: (this.settings.details.vatNumber || ""), disabled: !this.appComponent.checkRoles('pm')}),
          verificationInformation: new FormControl({value: (this.settings.details.verificationInformation || ""), disabled: (!this.appComponent.checkRoles('pm') && this.settings.details.verificationInformation)}),
          businessType: new FormControl({value: (this.settings.details.businessType || ""), disabled: !this.appComponent.checkRoles('pm')}),
          industrySectors: new FormControl({value: (this.settings.details.industrySectors[0] || ""), disabled: !this.appComponent.checkRoles('pm')}),
          businessKeywords: new FormControl({value: (this.selectValueOfTextObject(this.settings.details.businessKeywords) || ""), disabled: (!this.appComponent.checkRoles('pm') && Object.keys(this.settings.details.businessKeywords).length == 0)}),
          yearOfReg: new FormControl({value: (this.settings.details.yearOfCompanyRegistration || ""), disabled: (!this.appComponent.checkRoles('pm') && this.settings.details.yearOfCompanyRegistration)}),
          address: AddressSubForm.update(AddressSubForm.generateForm(this._fb), this.settings.details.address)
      });
      this.computeUserFromCookies();
    }

    save(model: FormGroup) {
      this.saveCallStatus.submit();
      var sectorString = model.getRawValue()['industrySectors'];
      if (Array.isArray(sectorString))
        sectorString = sectorString.join(", ");
      this.settings.details.legalName =  createTextObject(model.getRawValue()['name']);
      this.settings.details.brandName = createTextObject(model.getRawValue()['brandName']);
      this.settings.details.vatNumber =  model.getRawValue()['vatNumber'];
      this.settings.details.verificationInformation =  model.getRawValue()['verificationInformation'];
      this.settings.details.businessType =  model.getRawValue()['businessType'];
      this.settings.details.industrySectors =  [sectorString];
      this.settings.details.businessKeywords =  createTextObject(model.getRawValue()['businessKeywords']);
      this.settings.details.yearOfCompanyRegistration =  model.getRawValue()['yearOfReg'];
      this.settings.details.address =  model.getRawValue()['address'];
      let compId = this.settings.companyID;
      this.userService
          .putSettingsForParty(this.settings, compId)
          .then(response => {
              if (myGlobals.debug) {
                  console.log(`Saved Company Settings for company ${compId}. Response: ${response}`);
              }
              this.saveCallStatus.callback("Successfully saved", true);
              this.dataForm.markAsPristine();
              this.onSaveEvent.emit();
          })
          .catch(error => {
              this.saveCallStatus.error("Error while saving company settings", error);
          });
    }

    changeData(content) {
        this.mailto = "mailto:"+this.config.supportMail;
        var subject = "NIMBLE Company Data Change Request (UserID: " + this.appComponent.userID + ", Timestamp: " + new Date().toISOString() + ")";
        this.mailto += "?subject=" + encodeURIComponent(subject);
        var body = "Dear NIMBLE support team,";
        body += "\n\n\n";
        body += "I would like to change my company data to the following:";
        body += "\n\n";
        body += "Company Name:\n";
        body += this.selectValueOfTextObject(this.settings.details.legalName) + "\n\n";
        body += "VAT Number:\n";
        body += this.settings.details.vatNumber + "\n\n";
        body += "Verification Info:\n";
        body += this.settings.details.verificationInformation + "\n\n";
        body += "Business Type:\n";
        body += this.settings.details.businessType + "\n\n";
        body += "Activity Sectors:\n";
        body += this.settings.details.industrySectors[0] + "\n\n";
        body += "Business Keywords:\n";
        body += this.selectValueOfTextObject(this.settings.details.businessKeywords) + "\n\n";
        body += "Year of Foundation:\n";
        body += this.settings.details.yearOfCompanyRegistration + "\n\n";
        body += "Street:\n";
        body += this.settings.details.address.streetName + "\n\n";
        body += "Building Number:\n";
        body += this.settings.details.address.buildingNumber + "\n\n";
        body += "City:\n";
        body += this.settings.details.address.cityName + "\n\n";
        body += "Postal Code:\n";
        body += this.settings.details.address.postalCode + "\n\n";
        body += "Country:\n";
        body += this.settings.details.address.country;
        body += "\n\n\n";
        body += "Best regards,";
        body += "\n\n";
        body += this.appComponent.fullName;
        body += "\n";
        body += "(E-Mail: " + this.appComponent.eMail + ", Company: " + this.appComponent.activeCompanyName + ", CompanyID: " + this.appComponent.companyID + ")";
        this.mailto += "&body=" + encodeURIComponent(body);
        this.modalService.open(content);
    }

    showVerificationTT(content) {
        const tooltip = "Please provide links to external resources or any other information that prove your connection to the company you want to register as a legal representative.<br/><br/>"
             + "e.g. Company member listing on an official website, signing authority, company registration at external authorities, additional identification numbers, ...";
        this.tooltipHTML = tooltip;
        this.modalService.open(content);
    }

    showSectorTT(content) {
      var tooltip = "";
  		tooltip += "Hold down the Ctrl key in order to select multiple sectors";
  		this.tooltipHTML = tooltip;
  		this.modalService.open(content);
    }

    showKeywordsTT(content) {
      var tooltip = "";
  		tooltip += "List some keywords that represent your business. Those will be used to improve the visibility of your company on the platform.<br/><br/>";
      tooltip += "e.g.: Design, Bathroom Manufacturing, Home Accessories";
  		this.tooltipHTML = tooltip;
  		this.modalService.open(content);
    }

    private computeUserFromCookies(): void {
      this.user = new DashboardUser(
          this.cookieService.get("user_fullname") || ""
      )

      if (this.cookieService.get("user_id") && this.cookieService.get("company_id")) {
          this.user.hasCompany = this.cookieService.get("company_id") !== "null"
      }

      if (this.cookieService.get("bearer_token")) {
          const at = this.cookieService.get("bearer_token");
          if (at.split(".").length == 3) {
              const at_payload = at.split(".")[1];
              try {
                  const at_payload_json = JSON.parse(atob(at_payload));
                  const at_payload_json_roles = at_payload_json["realm_access"]["roles"];
                  this.user.roles = at_payload_json_roles;
              } catch (e) {}
          }
      }
  }
}
