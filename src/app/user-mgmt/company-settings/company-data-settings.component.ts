/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { AppComponent } from "../../app.component";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as myGlobals from '../../globals';
import {
    selectValueOfTextObject,
    getArrayOfTextObject,
    createTextObjectFromArray,
    getArrayOfTextObjectArrays, createNewLineSeparatedTextObjectFromArray
} from '../../common/utils';
import { FormBuilder, FormGroup, FormControl } from "@angular/forms";
import { AddressSubForm } from "../subforms/address.component";
import { CallStatus } from "../../common/call-status";
import { UserService } from "../user.service";
import { TranslateService } from '@ngx-translate/core';
import { Router } from "@angular/router";
import { LANGUAGES, DEFAULT_LANGUAGE } from "../../catalogue/model/constants";
import { BPEService } from "../../bpe/bpe.service";

@Component({
    selector: "company-data-settings",
    templateUrl: "./company-data-settings.component.html"
})
export class CompanyDataSettingsComponent implements OnInit {

    @Input() settings: CompanySettings;
    companyNameArr: any;
    brandNameArr: any;
    industrySectorsArr: any;
    industrySectorsToBeAdded: string[] = [];
    businessKeywordsArr: any;
    businessKeywordsToBeAdded: string[] = [];
    dataForm: FormGroup;
    inputChanged = false;
    languages = LANGUAGES;
    mailto: string;
    tooltipHTML: string;
    config = myGlobals.config;
    alertClosed = false;
    forceActText = true;
    isAllCollaborationsFinished = false;
    saveCallStatus: CallStatus = new CallStatus();
    @Output() onSaveEvent: EventEmitter<void> = new EventEmitter();

    selectValueOfTextObject = selectValueOfTextObject;
    // keeps the keys of available activity sector
    // it is updated when business type is changed
    availableActivitySectorKeys:string[] = null;

    constructor(public appComponent: AppComponent,
        private _fb: FormBuilder,
        private translate: TranslateService,
        private modalService: NgbModal,
        private userService: UserService,
        private bpeService: BPEService,
        private router: Router) {

    }

    ngOnInit() {
        this.companyNameArr = getArrayOfTextObject(this.settings.details.legalName);
        this.brandNameArr = getArrayOfTextObject(this.settings.details.brandName);
        this.industrySectorsArr = getArrayOfTextObjectArrays(this.settings.details.industrySectors);
        this.industrySectorsToBeAdded = new Array(this.industrySectorsArr.length).fill(null);
        this.businessKeywordsArr = getArrayOfTextObjectArrays(this.settings.details.businessKeywords);
        this.businessKeywordsToBeAdded = new Array(this.businessKeywordsArr.length).fill(null);
        this.dataForm = this._fb.group({
            vatNumber: new FormControl({ value: (this.settings.details.vatNumber || ""), disabled: !this.appComponent.checkRoles('pm') }),
            verificationInformation: new FormControl({ value: (this.settings.details.verificationInformation || ""), disabled: (!this.appComponent.checkRoles('pm') && this.settings.details.verificationInformation) }),
            businessType: new FormControl({ value: (this.settings.details.businessType || ""), disabled: !this.appComponent.checkRoles('pm') }),
            yearOfReg: new FormControl({ value: (this.settings.details.yearOfCompanyRegistration || ""), disabled: (!this.appComponent.checkRoles('pm') && this.settings.details.yearOfCompanyRegistration) }),
            address: AddressSubForm.update(AddressSubForm.generateForm(this._fb), this.settings.details.address)
        });
        // set available activity sector keys
        this.setAvailableActivitySectorKeys();
        if (!this.appComponent.checkRoles('pm')) {
            this.bpeService.checkAllCollaborationsFinished(this.settings.companyID, this.settings.negotiationSettings.company.federationInstanceID).then(finished => {
                this.isAllCollaborationsFinished = finished;
            });
        }
    }


    setAvailableActivitySectorKeys(){
        // get activity sectors for the selected business type
        let activitySectors = this.config.supportedActivitySectors[this.dataForm.getRawValue()['businessType']];
        if(activitySectors){
            this.availableActivitySectorKeys = Object.keys(activitySectors);
        } else{
            this.availableActivitySectorKeys = [];
        }
    }

    trackFn(index, item) {
        return index;
    }

    isEmptyObject(obj) {
        return (Object.keys(obj).length == 0);
    }

    addCompanyName() {
        this.companyNameArr.push({ "text": "", "lang": "" });
        this.flagChanged();
    }

    removeCompanyName(index: number) {
        this.companyNameArr.splice(index, 1);
        if (this.companyNameArr.length == 0)
            this.companyNameArr = [{ "text": "", "lang": DEFAULT_LANGUAGE() }];
        this.flagChanged();
    }

    addBrandName() {
        this.brandNameArr.push({ "text": "", "lang": "" });
        this.flagChanged();
    }

    removeBrandName(index: number) {
        this.brandNameArr.splice(index, 1);
        if (this.brandNameArr.length == 0)
            this.brandNameArr = [{ "text": "", "lang": DEFAULT_LANGUAGE() }];
        this.flagChanged();
    }

    addIndustrySectors() {
        this.industrySectorsArr.push({ "text": [], "lang": "" });
        this.industrySectorsToBeAdded.push(null);
        this.flagChanged();
    }

    removeIndustrySectors(index: number) {
        this.industrySectorsArr.splice(index, 1);
        if (this.industrySectorsArr.length == 0)
            this.industrySectorsArr = [{ "text": [""], "lang": DEFAULT_LANGUAGE() }];
        this.flagChanged();
    }

    addBusinessKeywords() {
        this.businessKeywordsArr.push({ "text": [], "lang": "" });
        this.businessKeywordsToBeAdded.push(null);
        this.flagChanged();
    }

    removeBusinessKeywords(index: number) {
        this.businessKeywordsArr.splice(index, 1);
        if (this.businessKeywordsArr.length == 0)
            this.businessKeywordsArr = [{ "text": [""], "lang": DEFAULT_LANGUAGE() }];
        this.flagChanged();
    }

    flagChanged() {
        this.inputChanged = true;
    }

    isRequiredEmpty() {
        let empty = false;
        if (Object.keys(createTextObjectFromArray(this.companyNameArr)).length == 0)
            empty = true;
        else if(this.isActivitySectorRequired()){
            empty = true;
        }
        return empty;
    }

    isActivitySectorRequired(){
        return Object.keys(createTextObjectFromArray(this.industrySectorsArr)).length == 0;
    }

    deleteCompany(): void {
        if (this.settings.companyID) {
            this.appComponent.confirmModalComponent.open("Are you sure that you want to delete this company?").then(result => {
                if(result){
                    this.saveCallStatus.submit();
                    this.userService.deleteCompany(this.settings.companyID)
                        .then(res => {
                            this.saveCallStatus.callback("Successfully deleted company");
                            this.router.navigate(['/user-mgmt/logout']);
                        })
                        .catch(error => {
                            this.saveCallStatus.error("Error while deleting company", error);
                        });
                }
            });
        }
    }

    save(model: FormGroup) {
        this.saveCallStatus.submit();
        // retrieve the translations of each selected industry sector
        // so that we can index the selected industry sectors for all available languages
        let industrySectorWithMultilingualLabels = [];
        // the case where industry sectors are selected from the predefined values
        if (!this.forceActText) {
            // retrieve the translation of each industry sector for the available languages
            for (let languageId of myGlobals.config.languageSettings.available) {
                let industrySectorTranslations = []
                for (let industrySectorsArrKey of this.industrySectorsArr) {
                    for(let industrySector of industrySectorsArrKey.text){
                        if(this.config.supportedActivitySectors[model.getRawValue()['businessType']][industrySector][languageId]){
                            industrySectorTranslations.push(this.config.supportedActivitySectors[model.getRawValue()['businessType']][industrySector][languageId])
                        }
                    }
                }

                if(industrySectorTranslations.length > 0){
                    industrySectorWithMultilingualLabels.push({ "text": industrySectorTranslations, "lang": languageId});
                }
            }
        }
        else{
            industrySectorWithMultilingualLabels = this.industrySectorsArr;
        }
        this.settings.details.legalName = createTextObjectFromArray(this.companyNameArr);
        this.settings.details.brandName = createTextObjectFromArray(this.brandNameArr);
        this.settings.details.vatNumber = model.getRawValue()['vatNumber'];
        this.settings.details.verificationInformation = model.getRawValue()['verificationInformation'];
        this.settings.details.businessType = model.getRawValue()['businessType'];
        this.settings.details.industrySectors = createNewLineSeparatedTextObjectFromArray(industrySectorWithMultilingualLabels);
        this.settings.details.businessKeywords = createNewLineSeparatedTextObjectFromArray(this.businessKeywordsArr);
        this.settings.details.yearOfCompanyRegistration = model.getRawValue()['yearOfReg'];
        this.settings.details.address = model.getRawValue()['address'];
        let compId = this.settings.companyID;
        this.userService
            .putSettingsForParty(this.settings, compId)
            .then(response => {
                if (myGlobals.debug) {
                    console.log(`Saved Company Settings for company ${compId}. Response: ${response}`);
                }
                this.saveCallStatus.callback("Successfully saved", true);
                this.inputChanged = false;
                this.dataForm.markAsPristine();
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.saveCallStatus.error("Error while saving company settings", error);
            });
    }

    getMultilingualPredefinedIndustrySector(sector:string){
        let label = this.config.supportedActivitySectors[this.dataForm.getRawValue()['businessType']][sector][DEFAULT_LANGUAGE()];
        if(!label){
            label = this.config.supportedActivitySectors[this.dataForm.getRawValue()['businessType']][sector]['en'];
        }
        return label;
    }

    switchInput() {
        this.industrySectorsArr = [{ "text": [], "lang": DEFAULT_LANGUAGE() }];
        this.forceActText = !this.forceActText;
    }

    onBusinessKeywordAdded(index:number) {
        if (this.businessKeywordsToBeAdded[index]) {
            this.businessKeywordsArr[index].text.push(this.businessKeywordsToBeAdded[index]);
            this.businessKeywordsToBeAdded[index] = null;
            this.flagChanged();
        }
    }

    onBusinessKeywordRemoved(index:number,valueIndex:number) {
        this.businessKeywordsArr[index].text.splice(valueIndex,1);
        this.flagChanged();
    }

    onIndustrySectorRemoved(index:number,valueIndex:number) {
        this.industrySectorsArr[index].text.splice(valueIndex,1);
        this.flagChanged();
    }

    onIndustrySectorAdded(index:number) {
        if (this.industrySectorsToBeAdded[index]) {
            this.industrySectorsArr[index].text.push(this.industrySectorsToBeAdded[index]);
            this.industrySectorsToBeAdded[index] = null;
            this.flagChanged();
        }
    }

    changeData(content) {
        this.mailto = "mailto:" + this.config.supportMail;
        var subject = this.translate.instant("Company Data Change Request",{platformName:this.config.platformNameInMail})+" ("+this.translate.instant("UserID")+": " + this.appComponent.userID + ", "+this.translate.instant("Platform")+": " +
            this.config.platformName + ", Timestamp: " + new Date().toISOString() + ")";
        this.mailto += "?subject=" + encodeURIComponent(subject);
        var body = this.translate.instant("Dear support team,",{platformName:this.config.platformNameInMail});
        body += "\n\n\n";
        body += this.translate.instant("I would like to change my company data to the following:");
        body += "\n\n";
        body += this.translate.instant("Company Name:");
        body += "\n";
        body += this.selectValueOfTextObject(this.settings.details.legalName) + "\n\n";
        body += this.translate.instant("Brand Name:");
        body += "\n";
        body += this.selectValueOfTextObject(this.settings.details.brandName) + "\n\n";
        body += this.translate.instant("VAT Number:");
        body += "\n";
        body += this.settings.details.vatNumber + "\n\n";
        body += this.translate.instant("Verification Info:");
        body += "\n";
        body += this.settings.details.verificationInformation + "\n\n";
        body += this.translate.instant("Business Type:");
        body += "\n";
        body += this.settings.details.businessType + "\n\n";
        body += this.translate.instant("Activity Sectors:");
        body += "\n";
        body += this.selectValueOfTextObject(this.settings.details.industrySectors) + "\n\n";
        body += this.translate.instant("Business Keywords:");
        body += "\n";
        body += this.selectValueOfTextObject(this.settings.details.businessKeywords) + "\n\n";
        body += this.translate.instant("Year of Foundation:");
        body += "\n";
        body += this.settings.details.yearOfCompanyRegistration + "\n\n";
        body += this.translate.instant("Street:");
        body += "\n";
        body += this.settings.details.address.streetName + "\n\n";
        body += this.translate.instant("Building Number:");
        body += "\n";
        body += this.settings.details.address.buildingNumber + "\n\n";
        body += this.translate.instant("City / Town:");
        body += "\n";
        body += this.settings.details.address.cityName + "\n\n";
        body += this.translate.instant("State / Province:");
        body += "\n";
        body += this.settings.details.address.region + "\n\n";
        body += this.translate.instant("Postal Code:");
        body += "\n";
        body += this.settings.details.address.postalCode + "\n\n";
        body += this.translate.instant("Country:");
        body += "\n";
        body += this.settings.details.address.country;
        body += "\n\n\n";
        body += this.translate.instant("Best regards,");
        body += "\n\n";
        body += this.appComponent.fullName;
        body += "\n";
        body += "(E-Mail: " + this.appComponent.eMail + ", "+this.translate.instant("Company")+": " + this.appComponent.activeCompanyName + ", "+this.translate.instant("CompanyID")+": " + this.appComponent.companyID + ")";
        this.mailto += "&body=" + encodeURIComponent(body);
        this.modalService.open(content);
    }

    deleteData(content) {
        this.mailto = "mailto:" + this.config.supportMail;
        var subject = this.translate.instant("Company Deletion Request",{platformName:this.config.platformNameInMail}) +" ("+this.translate.instant("UserID")+": " + this.appComponent.userID + ", "+this.translate.instant("Platform")+": " +
            this.config.platformName + ", Timestamp: " + new Date().toISOString() + ")";
        this.mailto += "?subject=" + encodeURIComponent(subject);
        var body = this.translate.instant("Dear support team,",{platformName:this.config.platformNameInMail});
        body += "\n\n\n";
        body += this.translate.instant("I would like to delete my company:");
        body += "\n\n";
        body += this.translate.instant("Company Name:");
        body += "\n";
        body += this.selectValueOfTextObject(this.settings.details.legalName) + "\n\n";
        body += this.translate.instant("Company ID:");
        body += "\n";
        body += this.appComponent.companyID;
        body += "\n\n\n";
        body += this.translate.instant("Best regards,");
        body += "\n\n";
        body += this.appComponent.fullName;
        body += "\n";
        body += "(E-Mail: " + this.appComponent.eMail + ", "+this.translate.instant("Company")+": " + this.appComponent.activeCompanyName + ", "+this.translate.instant("CompanyID")+": " + this.appComponent.companyID + ")";
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
        this.tooltipHTML = this.translate.instant("Business Keyword Tool Tip");
        this.modalService.open(content);
    }

}
