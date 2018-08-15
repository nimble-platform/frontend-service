import { Component, OnInit } from "@angular/core";
import { AppComponent } from "../app.component";
import { FormBuilder, FormGroup } from "@angular/forms";
import { DeliveryTermsSubForm } from "./subforms/delivery-terms.component";
import { UserService } from "./user.service";
import { CookieService } from "ng2-cookies";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AddressSubForm } from "./subforms/address.component";
import * as myGlobals from "../globals";
import { CallStatus } from "../common/call-status";

@Component({
    selector: "company-settings",
    templateUrl: "./company-settings.component.html",
    styleUrls: ["./company-settings.component.css"]
})
export class CompanySettingsComponent implements OnInit {

    public settingsForm: FormGroup;
    public addCertForm: FormGroup;
    public aM = false;
    public mailto = "";
    public certificates = [];
    public prefCats = [];
    public ppapTypes = [
        "",
        "Design Documentation",
        "Engineering Change Documentation",
        "Customer Engineering Approval",
        "Design Failure Mode and Effects Analysis",
        "Process Flow Diagram",
        "Process Failure Mode and Effects Analysis",
        "Control Plan",
        "Measurement System Analysis Studies",
        "Dimensional Results",
        "Records of Material / Performance Tests",
        "Initial Process Studies",
        "Qualified Laboratory Documentation",
        "Appearance Approval Report",
        "Sample Production Parts",
        "Master Sample",
        "Checking Aids",
        "Customer Specific Requirements",
        "Part Submission Warrant"
    ];
    public certFile = null;
    tooltipHTML = "";
    selectedTab: "COMPANY_DATA" | "NEGOTIATION_SETTINGS" = "COMPANY_DATA";

    initCallStatus: CallStatus = new CallStatus();
    saveCallStatus: CallStatus = new CallStatus();
    saveCertCallStatus: CallStatus = new CallStatus();
    categoriesCallStatus: CallStatus[] = [];
    certificatesCallStatus: CallStatus[] = [];

    constructor(private _fb: FormBuilder, 
                private appComponent: AppComponent, 
                private cookieService: CookieService, 
                private modalService: NgbModal, 
                private userService: UserService) {
        
    }

    ngOnInit() {
        this.settingsForm = this._fb.group({
            name: [""],
            vatNumber: [""],
            verificationInformation: [""],
            website: [""],
            ppapCompatibilityLevel: [0],
            address: AddressSubForm.generateForm(this._fb),
            deliveryTerms: this._fb.array([DeliveryTermsSubForm.generateForm(this._fb)]) /*,
          paymentMeans: this._fb.array([PaymentMeansForm.generateForm(this._fb)])*/
        });
        this.aM = false;
        this.certificates = [];
        this.prefCats = [];
        this.ppapTypes.sort();
        AddressSubForm.setDisabled(this.settingsForm.controls["address"], true);
        this.initForm();
    }

    addCertificate(content) {
        this.addCertForm = this._fb.group({
            file: [""],
            name: [""],
            type: [""]
        });
        this.certFile = null;
        this.modalService.open(content);
    }

    setCertFile(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            this.certFile = file;
        } else {
            this.certFile = null;
        }
    }

    saveCert(model: FormGroup, close: any) {
        this.saveCertCallStatus.submit();
        const fields = model.getRawValue();
        this.userService
            .saveCert(this.certFile, encodeURIComponent(fields.name), encodeURIComponent(fields.type))
            .then(response => {
                close();
                this.saveCertCallStatus.callback("Certificate saved", true);
                this.ngOnInit();
            })
            .catch(error => {
                this.saveCertCallStatus.error("Error while saving cerficate", error);
            });
    }

    downloadCertificate(id: string) {
        this.userService.downloadCert(id);
    }

    removeCertificate(id: string, index: number) {
        if (confirm("Are you sure that you want to delete this certificate?")) {
            this.certificatesCallStatus[index].submit();
            this.userService
                .deleteCert(id)
                .then(response => {
                    this.certificatesCallStatus[index].callback("Succesfully deleted certificate", true);
                    this.ngOnInit();
                })
                .catch(error => {
                    this.certificatesCallStatus[index].error("Error while delefing certificate", error);
                });
        }
    }

    removeCat(cat: string, i: number) {
        if (confirm("Are you sure that you want to remove this category from your favorites?")) {
            this.categoriesCallStatus[i].submit();
            let userId = this.cookieService.get("user_id");
            this.userService.togglePrefCat(userId, cat).then(res => {
                this.prefCats = res;
                this.prefCats.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
                // it's ok to have onw more call status than the number of categories here
                // no need to replace the array again.
                this.categoriesCallStatus[i].callback("Succesfully removed category", true);
            })
            .catch(error => {
                this.categoriesCallStatus[i].error("Error while removing category from favourites", error);
            });
        }
    }

    private initForm() {
        this.initCallStatus.submit();
        let userId = this.cookieService.get("user_id");
        this.userService.getSettings(userId).then(settings => {
            if (myGlobals.debug) console.log("Fetched settings: " + JSON.stringify(settings));

            // update forms
            this.settingsForm.controls["name"].setValue(settings.name);
            this.settingsForm.controls["vatNumber"].setValue(settings.vatNumber);
            this.settingsForm.controls["verificationInformation"].setValue(settings.verificationInformation);
            this.settingsForm.controls["website"].setValue(settings.website);
            this.settingsForm.controls["ppapCompatibilityLevel"].setValue(settings.ppapCompatibilityLevel);
            this.certificates = settings.certificates;
            this.certificates.sort((a, b) => a.name.localeCompare(b.name));
            this.certificates.sort((a, b) => a.type.localeCompare(b.type));
            this.certificatesCallStatus = this.certificates.map(() => new CallStatus());
            this.prefCats = settings.preferredProductCategories;
            this.prefCats.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
            this.categoriesCallStatus = this.prefCats.map(() => new CallStatus());
            AddressSubForm.update(this.settingsForm.controls["address"], settings.address);
            //PaymentMeansForm.update(this.settingsForm.controls['paymentMeans']['controls'][0], settings.paymentMeans[0]);
            if (settings.deliveryTerms.length > 0) DeliveryTermsSubForm.update(this.settingsForm.controls["deliveryTerms"]["controls"][0], settings.deliveryTerms[0]);
            else this.copyAddress();
            this.checkAddressMatch();
            this.initCallStatus.callback("Settings successfully fetched", true);
        })
        .catch(error => {
            this.initCallStatus.error("Error while fetching company settings", error);
        });
    }

    changeData(content) {
        var company_json = AddressSubForm.get(this.settingsForm.controls["address"]);
        this.mailto = "mailto:nimble-support@salzburgresearch.at";
        var subject = "NIMBLE Company Data Change Request (UserID: " + this.appComponent.userID + ", Timestamp: " + new Date().toISOString() + ")";
        this.mailto += "?subject=" + encodeURIComponent(subject);
        var body = "Dear NIMBLE support team,";
        body += "\n\n\n";
        body += "I would like to change my company data to the following:";
        body += "\n\n";
        body += "Legal Name:\n";
        body += this.settingsForm.controls["name"].value + "\n\n";
        body += "VAT Number:\n";
        body += this.settingsForm.controls["vatNumber"].value + "\n\n";
        body += "Verification Info:\n";
        body += this.settingsForm.controls["verificationInformation"].value + "\n\n";
        body += "Website:\n";
        body += this.settingsForm.controls["website"].value + "\n\n";
        body += "Street:\n";
        body += company_json.streetName + "\n\n";
        body += "Building Number:\n";
        body += company_json.buildingNumber + "\n\n";
        body += "City:\n";
        body += company_json.cityName + "\n\n";
        body += "Postal Code:\n";
        body += company_json.postalCode + "\n\n";
        body += "Country:\n";
        body += company_json.country;
        body += "\n\n\n";
        body += "Best regards,";
        body += "\n\n";
        body += this.appComponent.fullName;
        body += "\n";
        body += "(E-Mail: " + this.appComponent.eMail + ", Company: " + this.appComponent.activeCompanyName + ", CompanyID: " + this.appComponent.companyID + ")";
        this.mailto += "&body=" + encodeURIComponent(body);
        this.modalService.open(content);
    }

    changeFlag() {
        if (this.aM) {
            this.copyAddress();
            DeliveryTermsSubForm.setMatch(this.settingsForm.controls["deliveryTerms"]["controls"][0], true);
        } else {
            DeliveryTermsSubForm.setMatch(this.settingsForm.controls["deliveryTerms"]["controls"][0], false);
        }
    }

    checkAddressMatch() {
        var delivery_json = DeliveryTermsSubForm.getAddress(this.settingsForm.controls["deliveryTerms"]["controls"][0]);
        var company_json = AddressSubForm.get(this.settingsForm.controls["address"]);
        var delivery_empty = true;
        for (var key in delivery_json) {
            if (delivery_json[key] != "") delivery_empty = false;
        }
        if (delivery_empty) {
            this.copyAddress();
            delivery_json = DeliveryTermsSubForm.getAddress(this.settingsForm.controls["deliveryTerms"]["controls"][0]);
        }
        var address_matching = true;
        for (var key in delivery_json) {
            if (delivery_json[key].localeCompare(company_json[key]) != 0) address_matching = false;
        }
        if (address_matching) {
            this.aM = true;
            this.changeFlag();
        } else {
            this.aM = false;
            this.changeFlag();
        }
    }

    copyAddress() {
        DeliveryTermsSubForm.setSame(this.settingsForm.controls["deliveryTerms"]["controls"][0], AddressSubForm.get(this.settingsForm.controls["address"]));
    }

    save(model: FormGroup) {
        if (myGlobals.debug) console.log(`Changing company ${JSON.stringify(model.getRawValue())}`);

        // update settings
        this.saveCallStatus.submit();
        let userId = this.cookieService.get("user_id");
        this.userService
            .putSettings(model.getRawValue(), userId)
            .then(response => {
                if (myGlobals.debug) console.log(`Saved Company Settings for user ${userId}. Response: ${response}`);
                this.saveCallStatus.callback("Successfully saved", true);
                this.ngOnInit();
            })
            .catch(error => {
                this.saveCallStatus.error("Error while saving company settings", error);
            });
    }

    showVerificationTT(content) {
        var tooltip = "";
        tooltip += "Please provide links to external resources or any other information that prove your connection to the company you want to register as a legal representative.<br/><br/>";
        tooltip += "e.g. Company member listing on an official website, signing authority, company registration at external authorities, additional identification numbers, ...";
        this.tooltipHTML = tooltip;
        this.modalService.open(content);
    }

    onSelectTab(event: any) {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }
}
