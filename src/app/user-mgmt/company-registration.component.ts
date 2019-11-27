import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {AddressSubForm} from './subforms/address.component';
import {UserService} from './user.service';
import {CookieService} from 'ng2-cookies';
import {CompanyRegistration} from './model/company-registration';
import {CompanySettings} from './model/company-settings';
import {CompanyDetails} from './model/company-details';
import {Router} from '@angular/router';
import {AppComponent} from '../app.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from '../globals';
import {CallStatus} from '../common/call-status';
import {Address} from './model/address';
import {TranslateService} from '@ngx-translate/core';
import {getCountryByISO, getFileExtension, getArrayOfTextObject, createTextObjectFromArray} from '../common/utils';
import {ALLOWED_EXTENSIONS} from '../common/constants';
import {createTextObject, selectValueOfTextObject} from '../common/utils';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../catalogue/model/constants';

@Component({
    selector: 'company-registration',
    templateUrl: './company-registration.component.html',
    styleUrls: ['./company-registration.component.css']
})

export class CompanyRegistrationComponent implements OnInit {

    public alertClosed = false;
    public registrationForm: FormGroup;
    companyNameArr: any;
    brandNameArr: any;
    industrySectorsArr: any;
    businessKeywordsArr: any;
    config = myGlobals.config;
    submitCallStatus: CallStatus = new CallStatus();
    vatCallStatus: CallStatus = new CallStatus();
    tooltipHTML = "";
    imgFile = null;
    vatSkipped = false;
    vatValidated = false;
    vat = "";
    forceActText = false;
    languages = LANGUAGES;

    constructor(private _fb: FormBuilder,
                private appComponent: AppComponent,
                private cookieService: CookieService,
                private modalService: NgbModal,
                private router: Router,
                private translate: TranslateService,
                private userService: UserService) {
    }

    ngOnInit() {
        this.registrationForm = this._fb.group({
            vatNumber: [''],
            logo: [''],
            verificationInformation: [''],
            businessType: [''],
            yearOfReg: [''],
            address: AddressSubForm.generateForm(this._fb),
        });
        this.companyNameArr = getArrayOfTextObject({});
        this.brandNameArr = getArrayOfTextObject({});
        this.industrySectorsArr = getArrayOfTextObject({});
        this.businessKeywordsArr = getArrayOfTextObject({});
    }

    addCompanyName() {
      this.companyNameArr.push({"text":"","lang":""});
    }

    removeCompanyName(index:number){
      this.companyNameArr.splice(index,1);
      if (this.companyNameArr.length == 0)
        this.companyNameArr = [{"text":"","lang":DEFAULT_LANGUAGE()}];
    }

    addBrandName() {
      this.brandNameArr.push({"text":"","lang":""});
    }

    removeBrandName(index:number){
      this.brandNameArr.splice(index,1);
      if (this.brandNameArr.length == 0)
        this.brandNameArr = [{"text":"","lang":DEFAULT_LANGUAGE()}];
    }

    addIndustrySectors() {
      this.industrySectorsArr.push({"text":"","lang":""});
    }

    removeIndustrySectors(index:number){
      this.industrySectorsArr.splice(index,1);
      if (this.industrySectorsArr.length == 0)
        this.industrySectorsArr = [{"text":"","lang":DEFAULT_LANGUAGE()}];
    }

    addBusinessKeywords() {
      this.businessKeywordsArr.push({"text":"","lang":""});
    }

    removeBusinessKeywords(index:number){
      this.businessKeywordsArr.splice(index,1);
      if (this.businessKeywordsArr.length == 0)
        this.businessKeywordsArr = [{"text":"","lang":DEFAULT_LANGUAGE()}];
    }

    skipVAT() {
        this.vatSkipped = true;
    }

    backToVAT() {
        this.vatSkipped = false;
        this.vatValidated = false;
        this.companyNameArr = getArrayOfTextObject({});
        this.brandNameArr = getArrayOfTextObject({});
        this.registrationForm.controls['vatNumber'].setValue("");
        this.registrationForm.controls['logo'].setValue("");
        this.registrationForm.controls['verificationInformation'].setValue("");
        this.registrationForm.controls['businessType'].setValue("");
        this.businessKeywordsArr = getArrayOfTextObject({});
        this.industrySectorsArr = getArrayOfTextObject({});
        this.registrationForm.controls['yearOfReg'].setValue("");
        AddressSubForm.update(this.registrationForm.controls['address'] as FormGroup, new Address("", "", "", "", "", ""));
    }

    validateVAT() {
        this.vatCallStatus.submit();
        this.userService.validateVAT(this.vat)
            .then(response => {
                this.vatCallStatus.callback("VAT checked", true);
                if (response.IsValid) {
                    if (response.BusinessName && response.BusinessName != "" && response.BusinessName != "---") {
                        this.companyNameArr[0].text = response.BusinessName;
                    }
                    this.registrationForm.controls['vatNumber'].setValue(this.vat);
                    if (response.CountryCode)
                        AddressSubForm.update(this.registrationForm.controls['address'] as FormGroup, new Address("", "", "", "", "", getCountryByISO(response.CountryCode)));
                    this.vatValidated = true;
                } else {
                    setTimeout(function () {
                        alert("The VAT is invalid.");
                    }, 50);
                }
            })
            .catch(error => {
                this.vatCallStatus.error("Error while checking VAT", error);
            });
    }

    isRequiredEmpty() {
      let empty = false;
      if (Object.keys(createTextObjectFromArray(this.companyNameArr)).length == 0)
        empty = true;
      if (Object.keys(createTextObjectFromArray(this.industrySectorsArr)).length == 0)
        empty = true;
      return empty;
    }

    save(model: FormGroup) {
        if (this.industrySectorsArr.length == 1 && Array.isArray(this.industrySectorsArr[0].text)) {
          this.industrySectorsArr[0].text = this.industrySectorsArr[0].text.join("\n");
          this.industrySectorsArr[0].lang = DEFAULT_LANGUAGE();
        }
        // create company registration DTO
        let userId = this.cookieService.get('user_id');
        let companyRegistration: CompanyRegistration = new CompanyRegistration(
            userId,
            null,
            new CompanySettings(
                null,
                null,
                null,
                new CompanyDetails(
                    model.getRawValue()['address'],
                    createTextObjectFromArray(this.businessKeywordsArr),
                    model.getRawValue()['businessType'],
                    createTextObjectFromArray(this.companyNameArr),
                    createTextObjectFromArray(this.brandNameArr),
                    createTextObjectFromArray(this.industrySectorsArr),
                    model.getRawValue()['vatNumber'],
                    model.getRawValue()['verificationInformation'],
                    model.getRawValue()['yearOfReg'],
                    this.config.defaultBusinessProcessIds
                ),
                null,
                null,
                null,
                null
            )
        );

        if (myGlobals.debug)
            console.log(`Registering company ${JSON.stringify(companyRegistration)}`);

        this.submitCallStatus.submit();
        this.userService.registerCompany(companyRegistration)
            .then(response => {
                if (myGlobals.debug)
                    console.log(`Saved Company Settings for user ${userId}. Response: ${JSON.stringify(response)}`);

                this.cookieService.set('bearer_token', response.accessToken);

                if (response['companyID']) {
                    this.cookieService.set("company_id", response['companyID']);
                    this.cookieService.set("active_company_name", selectValueOfTextObject(response['settings']['details']['legalName']));
                }

                if (this.config.logoRequired) {
                    this.userService
                        .saveImage(this.imgFile, true, response['companyID'])
                        .then(() => {
                            this.submitCallStatus.callback("Registration submitted", true);
                            this.appComponent.checkLogin("/user-mgmt/company-settings");
                        })
                        .catch(error => {
                            this.submitCallStatus.error("Error while submitting company", error);
                        });
                } else {
                    this.submitCallStatus.callback("Registration submitted", true);
                    this.appComponent.checkLogin("/user-mgmt/company-settings");
                }

            })
            .catch(error => {
                this.submitCallStatus.error("Error while submitting company", error);
            });

        return false;
    }

    switchInput() {
      this.industrySectorsArr = [{"text":"","lang":DEFAULT_LANGUAGE()}];
      this.forceActText = !this.forceActText;
    }

    onSetImageFile(event: any, model: FormGroup) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            if (file) {
                const filesize = parseInt(((file.size / 1024) / 1024).toFixed(4));
                let isAllowedExtension = this.isAllowedExtension(file.name);
                if (filesize < 2 && isAllowedExtension) {
                    this.imgFile = file;
                } else {
                    this.imgFile = null;
                    model.patchValue({
                        logo: null
                    });

                    if (filesize > 2) {
                        alert("Maximum allowed filesize: 2 MB");
                    }else if(!isAllowedExtension){
                        alert("Supported file extensions: " + ALLOWED_EXTENSIONS.join());
                    }
                }
            }

        } else {
            this.imgFile = null;
            model.patchValue({
                logo: null
            });
            event.target.files = [];
        }
    }

    isAllowedExtension(fileName: string): boolean {
        let extension = getFileExtension(fileName);
        if (extension != null) {
            let filterResults = ALLOWED_EXTENSIONS.filter(allowedExtension => extension.toLocaleLowerCase() === allowedExtension.toLocaleLowerCase());
            return (filterResults.length !== 0);
        }
        return false;
    }

    showLogoTT(content) {
        var tooltip = "";
        tooltip += "Maximum allowed filesize: 2 MB<br/>";
        tooltip += "Allowed formats: PNG, JPG, GIF";
        this.tooltipHTML = tooltip;
        this.modalService.open(content);
    }

    showVerificationTT(content) {
        var tooltip = "";
        tooltip += "Please provide links to external resources or any other information that prove your connection to the company you want to register as a legal representative.<br/><br/>";
        tooltip += "e.g. Company member listing on an official website, signing authority, company registration at external authorities, additional identification numbers, ...";
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
