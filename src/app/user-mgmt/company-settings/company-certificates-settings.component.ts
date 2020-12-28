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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CompanySettings} from '../model/company-settings';
import {CallStatus} from '../../common/call-status';
//import { PPAP_CERTIFICATES } from "../../catalogue/model/constants";
import {UserService} from '../user.service';
import {CookieService} from 'ng2-cookies';
import {FormBuilder, FormGroup} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from '../../globals';
import {TranslateService} from '@ngx-translate/core';
import {BinaryObject} from '../../catalogue/model/publish/binary-object';
import {AppComponent} from '../../app.component';
import {Certificate} from '../model/certificate';

@Component({
    selector: "company-certificates-settings",
    templateUrl: "./company-certificates-settings.component.html"
})
export class CompanyCertificatesSettingsComponent {

    @Input() settings: CompanySettings;
    // all certificates including both circular economy and any other certificates
    _certificates: Certificate[];
    @Input()
    set certificates(certificates: Certificate[]) {
        this._certificates = certificates;
        this.onCertificatesChange();
    }
    get certificates(): Certificate[] {
        return this._certificates;
    }
    circularEconomyCertificates: Certificate[];
    arbitraryCertificates: Certificate[];
    @Input() ppapLevel: any;

    @Output() onSaveEvent: EventEmitter<void> = new EventEmitter();

    config = myGlobals.config;
    //ppapTypes: string[] = PPAP_CERTIFICATES;
    savePpapLevelCallStatus: CallStatus = new CallStatus();

    certFile = null;
    // whether a certificate file is provided or not
    // it is false while editing the certificate until the exiting file is replaced by a new file
    certificateFileProvided = false;
    selectedFiles: BinaryObject[] = [];
    // identifier of the certificate to be edited
    certificateIdToBeEdited = null;
    certificateGroup: 'arbitrary' | 'circularEconomy';
    addCertForm: FormGroup;
    saveCertCallStatus: CallStatus = new CallStatus();
    certificatesCallStatus: CallStatus = new CallStatus();

    constructor(private _fb: FormBuilder,
        private userService: UserService,
        private modalService: NgbModal,
        private appComponent: AppComponent,
        private translate: TranslateService,
        private cookieService: CookieService) {

    }

    onCertificatesChange(): void {
        // split circular economy and other certificates into dedicated arrays
        this.circularEconomyCertificates = [];
        this.arbitraryCertificates = [];
        this.certificates.forEach(cert => {
            if (cert.type === this.config.circularEconomy.certificateGroup) {
                this.circularEconomyCertificates.push(cert);
            } else {
                this.arbitraryCertificates.push(cert);
            }
        });
    }

    isPpapLevelDirty(): boolean {
        return this.settings.tradeDetails.ppapCompatibilityLevel !== this.ppapLevel;
    }

    onAddCertificate(content, certificateGroup: 'arbitrary' | 'circularEconomy') {
        // reset certificate id since we create a new certificate
        this.certificateGroup = certificateGroup;
        this.certificateIdToBeEdited = null;
        this.certificateFileProvided = false;
        this.selectedFiles = [];
        this.addCertForm = this._fb.group({
            file: [''],
            name: [''],
            description: [''],
            type: [''],
            uri: ['']
        });
        this.certFile = null;
        this.modalService.open(content);
    }

    onSaveCertificate(model: FormGroup, close: any) {
        this.saveCertCallStatus.submit();
        const fields = model.getRawValue();
        // set the certificate file if it is provided
        this.certFile = null;
        let certFileLanguageId = null;
        if(this.certificateFileProvided){
            var parts = [new Blob([this.selectedFiles[0].value], { type: this.selectedFiles[0].mimeCode })];
            this.certFile = new File(parts, this.selectedFiles[0].fileName, {
                type: this.selectedFiles[0].mimeCode
            });
            // set language id
            certFileLanguageId = this.selectedFiles[0].languageID;
        }

        this.userService.saveCert(
            this.certFile, encodeURIComponent(fields.name), encodeURIComponent(fields.description), encodeURIComponent(fields.type), encodeURIComponent(fields.uri),
            this.settings.companyID, this.certificateIdToBeEdited, certFileLanguageId
        )
            .then(() => {
                close();
                this.saveCertCallStatus.callback("Certificate saved", true);
                this.certificateIdToBeEdited = null;
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.saveCertCallStatus.error("Error while saving cerficate", error);
            });
    }

    onRemoveCertificate(id: string) {
        this.appComponent.confirmModalComponent.open("Are you sure that you want to delete this certificate?").then(result => {
            if(result){
                this.certificatesCallStatus.submit();
                this.userService
                    .deleteCert(id, this.settings.companyID)
                    .then(() => {
                        this.certificatesCallStatus.callback("Succesfully deleted certificate", true);
                        this.onSaveEvent.emit();
                    })
                    .catch(error => {
                        this.certificatesCallStatus.error("Error while deleting certificate", error);
                    });
            }
        });
    }

    onSetCertificateFile(event: any) {
        this.certificateFileProvided = true;
    }

    removedFile(event: boolean) {
        if (event) {
            if (this.selectedFiles.length == 0) {
                this.certificateFileProvided = false;
            }
        }
    }

    onSavePpapLevel(): void {
        this.savePpapLevelCallStatus.submit();

        this.settings.tradeDetails.ppapCompatibilityLevel = this.ppapLevel;
        this.userService.putSettingsForParty(this.settings, this.settings.companyID)
            .then(() => {
                this.savePpapLevelCallStatus.callback("Ppap level saved.", true);
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.savePpapLevelCallStatus.error("Error while saving Ppap level.", error);
            });
    }

    onEditCertificate(popup, cert: Certificate): void {
        this.certificateFileProvided = false;
        this.certificateIdToBeEdited = cert.id;
        this.certificateGroup = cert.type === this.config.circularEconomy.certificateGroup ? 'circularEconomy' : 'arbitrary';
        this.userService.downloadCertObject(cert.id).then(certObj => {
            let binaryObject: BinaryObject = certObj.documentReference[0].attachment.embeddedDocumentBinaryObject;
            var parts = [new Blob([binaryObject.value], { type: binaryObject.mimeCode })];
            this.certFile = new File(parts, binaryObject.fileName, {
                type: binaryObject.mimeCode
            });

            this.addCertForm = this._fb.group({
                name: [cert.name],
                description: [cert.description],
                type: [cert.type],
                uri: [cert.uri]
            });
            this.selectedFiles = [binaryObject];
            this.certFile = null;
            this.modalService.open(popup);
        });
    }

    onDownloadCertificate(id: string) {
        this.userService.downloadCert(id);
    }

    /*
     template getters
     */
    public getCircularCertificateTypes(): string[] {
        return this.config.circularEconomy.certificates;
    }
}
