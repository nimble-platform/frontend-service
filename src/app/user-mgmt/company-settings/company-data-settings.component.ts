import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { AppComponent } from "../../app.component";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as myGlobals from '../../globals';
import {selectValueOfTextObject, createTextObject} from '../../common/utils';
import { FormBuilder, FormGroup, FormControl } from "@angular/forms";
import { AddressSubForm } from "../subforms/address.component";
import { CallStatus } from "../../common/call-status";
import { UserService } from "../user.service";

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

    constructor(private appComponent: AppComponent,
                private _fb: FormBuilder,
                private modalService: NgbModal,
                private userService: UserService) {

    }

    ngOnInit() {
      let industrySectorVal;
      if (this.settings.details.industrySectors && this.selectValueOfTextObject(this.settings.details.industrySectors))
        industrySectorVal = this.selectValueOfTextObject(this.settings.details.industrySectors);
      else
        industrySectorVal = "";
      if (this.isSectorArray(industrySectorVal)) {
        industrySectorVal = this.getSectorArray(industrySectorVal);
        this.forceActText = false;
      }
      else
        this.forceActText = true;
      this.dataForm = this._fb.group({
          name: new FormControl({value: (this.selectValueOfTextObject(this.settings.details.legalName) || ""), disabled: !this.appComponent.checkRoles('pm')}),
          brandName: new FormControl({value: (this.selectValueOfTextObject(this.settings.details.brandName) || ""), disabled: (!this.appComponent.checkRoles('pm') && Object.keys(this.settings.details.brandName).length == 0)}),
          vatNumber: new FormControl({value: (this.settings.details.vatNumber || ""), disabled: !this.appComponent.checkRoles('pm')}),
          verificationInformation: new FormControl({value: (this.settings.details.verificationInformation || ""), disabled: (!this.appComponent.checkRoles('pm') && this.settings.details.verificationInformation)}),
          businessType: new FormControl({value: (this.settings.details.businessType || ""), disabled: !this.appComponent.checkRoles('pm')}),
          industrySectors: new FormControl({value: industrySectorVal, disabled: !this.appComponent.checkRoles('pm')}),
          businessKeywords: new FormControl({value: (this.selectValueOfTextObject(this.settings.details.businessKeywords) || ""), disabled: (!this.appComponent.checkRoles('pm') && Object.keys(this.settings.details.businessKeywords).length == 0)}),
          yearOfReg: new FormControl({value: (this.settings.details.yearOfCompanyRegistration || ""), disabled: (!this.appComponent.checkRoles('pm') && this.settings.details.yearOfCompanyRegistration)}),
          address: AddressSubForm.update(AddressSubForm.generateForm(this._fb), this.settings.details.address)
      });
    }

    save(model: FormGroup) {
      this.saveCallStatus.submit();
      var sectorString = model.getRawValue()['industrySectors'];
      if (Array.isArray(sectorString))
        sectorString = sectorString.join("\n");
      this.settings.details.legalName =  createTextObject(model.getRawValue()['name']);
      this.settings.details.brandName = createTextObject(model.getRawValue()['brandName']);
      this.settings.details.vatNumber =  model.getRawValue()['vatNumber'];
      this.settings.details.verificationInformation =  model.getRawValue()['verificationInformation'];
      this.settings.details.businessType =  model.getRawValue()['businessType'];
      this.settings.details.industrySectors =  createTextObject(sectorString);
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

    isSectorArray(sectors): boolean {
      let isArray = true;
      if (this.config.supportedActivitySectors[this.settings.details.businessType] && this.config.supportedActivitySectors[this.settings.details.businessType].length>0) {
        let sectorsArr = sectors.split("\n");
        let availableSectors = this.config.supportedActivitySectors[this.settings.details.businessType];
        for (let i=0; i<sectorsArr.length; i++) {
          if (availableSectors.indexOf(sectorsArr[i]) == -1)
            isArray = false;
        }
      }
      else
        isArray = false;
      return isArray;
    }

    getSectorArray(sectors): string[] {
      return sectors.split("\n");
    }

    switchInput() {
      this.dataForm.controls['industrySectors'].setValue("");
      this.forceActText = !this.forceActText;
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
        body += this.selectValueOfTextObject(this.settings.details.industrySectors) + "\n\n";
        body += "Business Keywords:\n";
        body += this.selectValueOfTextObject(this.settings.details.businessKeywords) + "\n\n";
        body += "Year of Foundation:\n";
        body += this.settings.details.yearOfCompanyRegistration + "\n\n";
        body += "Street:\n";
        body += this.settings.details.address.streetName + "\n\n";
        body += "Building Number:\n";
        body += this.settings.details.address.buildingNumber + "\n\n";
        body += "City / Town:\n";
        body += this.settings.details.address.cityName + "\n\n";
        body += "State / Province:\n";
        body += this.settings.details.address.region + "\n\n";
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

}
