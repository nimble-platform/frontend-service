import { Component, Input , EventEmitter, Output} from "@angular/core";
import { ProductWrapper } from "../common/product-wrapper";
import { CompanySettings } from "../user-mgmt/model/company-settings";
import { UserService } from "../user-mgmt/user.service";
import {CatalogueService} from "../catalogue/catalogue.service";
import {Certificate} from "../catalogue/model/publish/certificate";
import {Country} from '../catalogue/model/publish/country';

@Component({
    selector: 'product-details-certificates',
    templateUrl: './product-details-certificates.component.html'
})
export class ProductDetailsCertificatesComponent {

    @Input() wrapper: ProductWrapper;
    @Input() settings: CompanySettings;
    @Output() certificateStatus = new EventEmitter<boolean>();

    constructor(private userService: UserService,
                private catalogueService: CatalogueService) {

    }
    ngOnInit() {
        if(this.settings.certificates.length == 0 && this.wrapper.line.goodsItem.item.certificate.length == 0){
            this.certificateStatus.emit(true);
        }
    }

    downloadCertificate(id: string) {
        this.userService.downloadCert(id);
    }

    getCertificateCountryNames(countries: Country[]) {
        let countryNames:string = null;
        if(countries == null || countries.length == 0) {
            return countryNames;
        }

        for(let country of countries) {
        	if (countryNames==null){
        		countryNames = country.name.value;
        	}
        	else{
	            countryNames += "," + country.name.value;
	        }
        }
        return countryNames;
    }
    
    downloadProductCertificate(certificate: Certificate) {
        this.catalogueService.getBinaryObject(certificate.documentReference[0].attachment.embeddedDocumentBinaryObject.uri).then(binaryObject => {
            const binaryString = window.atob(binaryObject.value);
            const binaryLen = binaryString.length;
            const bytes = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
                const ascii = binaryString.charCodeAt(i);
                bytes[i] = ascii;
            }
            const a = document.createElement("a");
            document.body.appendChild(a);
            const blob = new Blob([bytes], { type: binaryObject.mimeCode });
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = binaryObject.fileName;
            a.click();
            window.URL.revokeObjectURL(url);

        }).catch(error => {
            console.error("Failed to download the file",error);
        });
    }
}
