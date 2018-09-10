import { Component, OnInit, Input } from "@angular/core";
import { CompanySettings } from "../model/company-settings";
import { AppComponent } from "../../app.component";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "company-data-settings",
    templateUrl: "./company-data-settings.component.html"
})
export class CompanyDataSettingsComponent implements OnInit {
    
    @Input() settings: CompanySettings;

    mailto: string;
    tooltipHTML: string;

    constructor(private appComponent: AppComponent,
                private modalService: NgbModal) {

    }

    ngOnInit() {
        
    }

    changeData(content) {
        this.mailto = "mailto:nimble-support@salzburgresearch.at";
        var subject = "NIMBLE Company Data Change Request (UserID: " + this.appComponent.userID + ", Timestamp: " + new Date().toISOString() + ")";
        this.mailto += "?subject=" + encodeURIComponent(subject);
        var body = "Dear NIMBLE support team,";
        body += "\n\n\n";
        body += "I would like to change my company data to the following:";
        body += "\n\n";
        body += "Legal Name:\n";
        body += this.settings.name + "\n\n";
        body += "VAT Number:\n";
        body += this.settings.vatNumber + "\n\n";
        body += "Verification Info:\n";
        body += this.settings.verificationInformation + "\n\n";
        body += "Website:\n";
        body += this.settings.website + "\n\n";
        body += "Street:\n";
        body += this.settings.address.streetName + "\n\n";
        body += "Building Number:\n";
        body += this.settings.address.buildingNumber + "\n\n";
        body += "City:\n";
        body += this.settings.address.cityName + "\n\n";
        body += "Postal Code:\n";
        body += this.settings.address.postalCode + "\n\n";
        body += "Country:\n";
        body += this.settings.address.country;
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

}
