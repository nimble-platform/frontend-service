import { Component, Input } from "@angular/core";
import { ProductWrapper } from "../common/product-wrapper";
import { CompanySettings } from "../user-mgmt/model/company-settings";
import { UserService } from "../user-mgmt/user.service";

@Component({
    selector: 'product-details-certificates',
    templateUrl: './product-details-certificates.component.html'
})
export class ProductDetailsCertificatesComponent {

    @Input() wrapper: ProductWrapper;
    @Input() settings: CompanySettings;

    constructor(private userService: UserService) {

    }

    downloadCertificate(id: string) {
        this.userService.downloadCert(id);
    }
}