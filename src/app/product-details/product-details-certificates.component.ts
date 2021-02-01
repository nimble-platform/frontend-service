/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ProductWrapper} from '../common/product-wrapper';
import {CompanySettings} from '../user-mgmt/model/company-settings';
import {Certificate} from '../catalogue/model/publish/certificate';
import {config} from '../globals';
import {Certificate as UserMgmtCertificate} from '../user-mgmt/model/certificate';
import { NON_PUBLIC_FIELD_ID } from '../catalogue/model/constants';

@Component({
    selector: 'product-details-certificates',
    templateUrl: './product-details-certificates.component.html'
})
export class ProductDetailsCertificatesComponent implements OnInit {

    @Input() wrapper: ProductWrapper;
    @Input() settings: CompanySettings;
    @Output() certificateStatus = new EventEmitter<boolean>();

    NON_PUBLIC_FIELD_ID = NON_PUBLIC_FIELD_ID;
    companyCircularEconomyCertificates: UserMgmtCertificate[];
    companyArbitraryCertificates: UserMgmtCertificate[];
    productCircularEconomyCertificates: Certificate[];
    productArbitraryCertificates: Certificate[];

    constructor() {
    }

    ngOnInit(): void {
        this.companyCircularEconomyCertificates = [];
        this.companyArbitraryCertificates = [];
        this.settings.certificates.forEach(cert => {
            if (cert.type === config.circularEconomy.certificateGroup) {
                this.companyCircularEconomyCertificates.push(cert);
            } else {
                this.companyArbitraryCertificates.push(cert);
            }
        });

        this.productCircularEconomyCertificates = [];
        this.productArbitraryCertificates = [];
        this.wrapper.line.goodsItem.item.certificate.forEach(cert => {
            if (cert.certificateType === config.circularEconomy.certificateGroup) {
                this.productCircularEconomyCertificates.push(cert);
            } else {
                this.productArbitraryCertificates.push(cert);
            }
        });
    }
}
