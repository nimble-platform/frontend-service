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

import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../user-mgmt/user.service';
import {Certificate as UserMgmtCertificate} from '../user-mgmt/model/certificate';
import {Certificate} from '../catalogue/model/publish/certificate';
import {DEFAULT_LANGUAGE} from '../catalogue/model/constants';
import {CatalogueService} from '../catalogue/catalogue.service';
import {CountryUtil} from './country-util';

@Component({
    selector: 'certificate-view',
    templateUrl: './certificate-view-component.html'
})
export class CertificateViewComponent implements OnInit {

    @Input() userMgmtCertificates: UserMgmtCertificate[] = null;
    @Input() certificates: Certificate[] = null;
    @Input() tableName: string = null;

    constructor(private userService: UserService,
                private catalogueService: CatalogueService) {

    }

    ngOnInit(): void {
    }

    downloadCertificate(id: string) {
        this.userService.downloadCert(id);
    }

    downloadProductCertificate(certificate: Certificate) {
        let defaultLanguage = DEFAULT_LANGUAGE();
        let fileUri = certificate.documentReference[0].attachment.embeddedDocumentBinaryObject.uri;
        for (let certFile of certificate.documentReference) {
            if (certFile.attachment.embeddedDocumentBinaryObject.languageID == defaultLanguage) {
                fileUri = certFile.attachment.embeddedDocumentBinaryObject.uri;
                break;
            }
        }
        this.catalogueService.getBinaryObject(fileUri).then(binaryObject => {
            const binaryString = window.atob(binaryObject.value);
            const binaryLen = binaryString.length;
            const bytes = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
                const ascii = binaryString.charCodeAt(i);
                bytes[i] = ascii;
            }
            const a = document.createElement('a');
            document.body.appendChild(a);
            const blob = new Blob([bytes], {type: binaryObject.mimeCode});
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = binaryObject.fileName;
            a.click();
            window.URL.revokeObjectURL(url);

        }).catch(error => {
            console.error('Failed to download the file', error);
        });
    }

    getCertificateCountryNames(certificate: Certificate): string[] {
        let countryNames: string[] = [];
        if (certificate.country == null || certificate.country.length == 0) {
            return countryNames;
        }

        for (let country of certificate.country) {
            countryNames.push(CountryUtil.getCountryByISO(country.identificationCode.value));
        }
        return countryNames;
    }

}
