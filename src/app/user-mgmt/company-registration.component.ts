import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AddressSubForm } from './subforms/address.component';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { CompanyRegistration } from './model/company-registration';
import { CompanySettings } from './model/company-settings';
import { CompanyDetails } from './model/company-details';
import { Router } from '@angular/router';
import { AppComponent } from '../app.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from '../globals';
import { CallStatus } from '../common/call-status';

@Component({
    selector: 'company-registration',
    templateUrl: './company-registration.component.html',
    styleUrls: ['./company-registration.component.css']
})

export class CompanyRegistrationComponent implements OnInit {

    public alertClosed = false;
    public registrationForm: FormGroup;
    config = myGlobals.config;
    submitCallStatus: CallStatus = new CallStatus();
	   tooltipHTML = "";
     imgFile = null;

    constructor(private _fb: FormBuilder,
				        private appComponent: AppComponent,
                private cookieService: CookieService,
				        private modalService: NgbModal,
                private router: Router,
                private userService: UserService) {
    }

    ngOnInit() {
        this.registrationForm = this._fb.group({
            name: [''],
      			vatNumber: [''],
            logo: [''],
      			verificationInformation: [''],
            businessType: [''],
            businessKeywords: [''],
            industrySectors: [''],
            yearOfReg: [''],
            address: AddressSubForm.generateForm(this._fb),
        });
    }

    save(model: FormGroup) {
        var sectorString = model.getRawValue()['industrySectors'];
        if (Array.isArray(sectorString))
          sectorString = sectorString.join(", ");
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
                [model.getRawValue()['businessKeywords']],
                model.getRawValue()['businessType'],
                model.getRawValue()['name'],
                [sectorString],
                model.getRawValue()['vatNumber'],
                model.getRawValue()['verificationInformation'],
                model.getRawValue()['yearOfReg']
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

        				this.cookieService.set('bearer_token',response.accessToken);

                if( response['companyID'] ) {
                    this.cookieService.set("company_id", response['companyID']);
                    this.cookieService.set("active_company_name", response['settings']['details']['companyLegalName']);
                }

                if (this.config.logoRequired) {
                  this.userService
                      .saveImage(this.imgFile, true)
                      .then(() => {
                          this.submitCallStatus.callback("Registration submitted", true);
                          this.appComponent.checkLogin("/user-mgmt/company-settings");
                      })
                      .catch(error => {
                          this.submitCallStatus.error("Error while submitting company", error);
                      });
                }
                else {
                  this.submitCallStatus.callback("Registration submitted", true);
                  this.appComponent.checkLogin("/user-mgmt/company-settings");
                }

            })
            .catch(error => {
                this.submitCallStatus.error("Error while submitting company", error);
            });

        return false;
    }

    onSetImageFile(event: any, model: FormGroup) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            if(file) {
                const filesize = parseInt((file.size/1024).toFixed(4));
                if (filesize < 256) {
                  this.imgFile = file;
                }
                else {
                  this.imgFile = null;
                  model.patchValue({
                    logo: null
                  });
                  alert("Maximum allowed filesize: 256 kB");
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

  showLogoTT(content) {
    var tooltip = "";
		tooltip += "Maximum allowed filesize: 256 kB<br/>";
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
