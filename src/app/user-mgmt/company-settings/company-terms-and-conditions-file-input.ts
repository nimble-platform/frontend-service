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
import {UserService} from '../user.service';
import {FormBuilder} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BinaryObject} from '../../catalogue/model/publish/binary-object';
import {AppComponent} from '../../app.component';
import {DocumentReference} from '../../catalogue/model/publish/document-reference';

@Component({
    selector: 'company-terms-and-conditions-file-input',
    templateUrl: './company-terms-and-conditions-file-input.html'
})
export class CompanyTermsAndConditionsFileInput {

    // input for readonly company terms and conditions
    @Input() termsAndConditions: DocumentReference[] = [];
    // input for editable company terms and conditions
    _settings: CompanySettings;

    get settings(): CompanySettings {
        return this._settings;
    }

    @Input()
    set settings(settings: CompanySettings) {
        this._settings = settings;
        this.onSettingsUpdated();
    }

    @Output() onSaveEvent: EventEmitter<void> = new EventEmitter();
    file = null;
    // it is false while editing the certificate until the exiting file is replaced by a new file
    fileProvided = false;
    selectedFiles: BinaryObject[] = [];
    // identifier of the certificate to be edited
    fileIdToBeEdited = null;
    // whether a certificate file is provided or not
    saveCallStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    constructor(private _fb: FormBuilder,
                private userService: UserService,
                private modalService: NgbModal,
                private appComponent: AppComponent) {

    }

    onSettingsUpdated() {
        this.termsAndConditions = this.settings.termsAndConditions;
    }

    onAddTermsAndConditionsFile(content) {
        // reset file id since we create a new terms and conditions file
        this.fileIdToBeEdited = null;
        this.fileProvided = false;
        this.selectedFiles = [];
        this.file = null;
        this.modalService.open(content);
    }

    onSaveFile(close: any) {
        this.saveCallStatus.submit();
        // set the file if it is provided
        this.file = null;
        if (this.fileProvided) {
            const parts = [new Blob([this.selectedFiles[0].value], {type: this.selectedFiles[0].mimeCode})];
            this.file = new File(parts, this.selectedFiles[0].fileName, {
                type: this.selectedFiles[0].mimeCode
            });
        }

        this.userService.saveTermsAndConditions(
            this.file, this.settings.companyID, this.fileIdToBeEdited
        )
            .then(() => {
                close();
                this.saveCallStatus.callback('Terms and conditions file saved', true);
                this.fileIdToBeEdited = null;
                this.onSaveEvent.emit();
            })
            .catch(error => {
                this.saveCallStatus.error('Error while saving terms and conditions file', error);
            });
    }

    onRemoveFile(id: string) {
        this.appComponent.confirmModalComponent.open('Are you sure that you want to delete this terms and conditions file ?').then(result => {
            if (result) {
                this.callStatus.submit();
                this.userService
                    .deleteTermsAndConditions(id, this.settings.companyID)
                    .then(() => {
                        this.callStatus.callback('Successfully deleted terms and conditions file', true);
                        this.onSaveEvent.emit();
                    })
                    .catch(error => {
                        this.callStatus.error('Error while deleting terms and conditions file', error);
                    });
            }
        });
    }

    onSetTermsAndConditionsFile(event: any) {
        this.fileProvided = true;
    }

    removedFile(event: boolean) {
        if (event) {
            if (this.selectedFiles.length == 0) {
                this.fileProvided = false;
            }
        }
    }

    onEditFile(popup, cert: DocumentReference): void {
        this.fileProvided = false;
        this.fileIdToBeEdited = cert.id;
        this.userService.downloadTermsAndConditionsObject(cert.id).then(documentReference => {
            let binaryObject: BinaryObject = documentReference.attachment.embeddedDocumentBinaryObject;
            const parts = [new Blob([binaryObject.value], {type: binaryObject.mimeCode})];
            this.file = new File(parts, binaryObject.fileName, {
                type: binaryObject.mimeCode
            });

            this.selectedFiles = [binaryObject];
            this.file = null;
            this.modalService.open(popup);
        });
    }

    onDownloadFile(id: string) {
        this.userService.downloadTermsAndConditions(id);
    }
}
