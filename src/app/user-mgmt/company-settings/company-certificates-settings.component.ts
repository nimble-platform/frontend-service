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
import { CallStatus } from "../../common/call-status";
//import { PPAP_CERTIFICATES } from "../../catalogue/model/constants";
import { UserService } from "../user.service";
import { CookieService } from "ng2-cookies";
import { FormGroup, FormBuilder } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as myGlobals from '../../globals';
import { TranslateService } from '@ngx-translate/core';
import { BinaryObject } from "../../catalogue/model/publish/binary-object";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";

@Component({
    selector: "company-certificates-settings",
    templateUrl: "./company-certificates-settings.component.html"
})
export class CompanyCertificatesSettingsComponent implements OnInit {

    @Input() settings: CompanySettings;
    @Input() certificates: any;
    @Input() ppapLevel: any;

    @Output() onSaveEvent: EventEmitter<void> = new EventEmitter();

    config = myGlobals.config;
    //ppapTypes: string[] = PPAP_CERTIFICATES;
    savePpapLevelCallStatus: CallStatus = new CallStatus();

    certFile = null;
    certificateFilesProvided = false;
    selectedFiles: BinaryObject[] = [];
    editCert = null;
    addCertForm: FormGroup;
    saveCertCallStatus: CallStatus = new CallStatus();
    certificatesCallStatus: CallStatus = new CallStatus();

    constructor(private _fb: FormBuilder,
        private userService: UserService,
        private modalService: NgbModal,
        private translate: TranslateService,
        private cookieService: CookieService) {

    }

    ngOnInit() {

    }

    isPpapLevelDirty(): boolean {
        return this.settings.tradeDetails.ppapCompatibilityLevel !== this.ppapLevel;
    }

    onAddCertificate(content) {
        this.certificateFilesProvided = false;
        this.selectedFiles = [];
        this.addCertForm = this._fb.group({
            file: [""],
            name: [""],
            description: [""],
            type: [""]
        });
        this.certFile = null;
        this.modalService.open(content);
    }

    onSaveCertificate(model: FormGroup, close: any) {
        this.saveCertCallStatus.submit();
        const fields = model.getRawValue();
        this.selectedFiles;

        var parts = [new Blob([this.selectedFiles[0].value], { type: this.selectedFiles[0].mimeCode })];
        this.certFile = new File(parts, this.selectedFiles[0].fileName, {
            type: this.selectedFiles[0].mimeCode
        });

        this.userService
            .saveCert(this.certFile, encodeURIComponent(fields.name), encodeURIComponent(fields.description), encodeURIComponent(fields.type), this.settings.companyID, this.editCert, this.selectedFiles[0].languageID)
            .then(() => {
                close();
                this.saveCertCallStatus.callback("Certificate saved", true);
                this.editCert = null;
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.saveCertCallStatus.error("Error while saving cerficate", error);
            });
    }

    onRemoveCertificate(id: string, index: number) {
        if (confirm("Are you sure that you want to delete this certificate?")) {
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
    }

    onSetCertificateFile(event: any) {
        this.certificateFilesProvided = true;
    }

    removedFile(event: boolean) {
        if (event) {
            if (this.selectedFiles.length == 0) {
                this.certificateFilesProvided = false;
            }
        }
    }

    onSavePpapLevel(): void {
        this.savePpapLevelCallStatus.submit();

        this.settings.tradeDetails.ppapCompatibilityLevel = this.ppapLevel;
        const userId = this.cookieService.get("user_id");
        this.userService.putSettings(this.settings, userId)
            .then(() => {
                this.savePpapLevelCallStatus.callback("Ppap level saved.", true);
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.savePpapLevelCallStatus.error("Error while saving Ppap level.", error);
            });
    }

    onEditCertificate(popup, i: number): void {
        let cert = this.certificates[i];
        this.certificateFilesProvided = true;
        this.editCert = cert.id;
        this.userService.downloadCertObject(cert.id).then(certObj => {
            let binaryObject: BinaryObject = certObj.documentReference[0].attachment.embeddedDocumentBinaryObject;
            var parts = [new Blob([binaryObject.value], { type: binaryObject.mimeCode })];
            this.certFile = new File(parts, binaryObject.fileName, {
                type: binaryObject.mimeCode
            });

            this.addCertForm = this._fb.group({
                name: [cert.name],
                description: [cert.description],
                type: [cert.type]
            });
            this.selectedFiles = [binaryObject];
            this.certFile = null;
            this.modalService.open(popup);
        });
    }

    onDownloadCertificate(id: string) {
        this.userService.downloadCert(id);
    }

}
