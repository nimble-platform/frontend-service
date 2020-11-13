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

import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import { CallStatus } from "../../common/call-status";
import { DEFAULT_LANGUAGE } from "../model/constants";
import { CategoryService } from "../category/category.service";
import { CatalogueService } from "../catalogue.service";
import { CookieService } from "ng2-cookies";
import { Category } from '../model/category/category';
import { ProductPublishComponent } from './product-publish.component';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: "bulk-publish",
    templateUrl: "./bulk-publish.component.html",
    styleUrls: ["./bulk-publish.component.css"]
})
export class BulkPublishComponent implements OnInit, OnChanges {
    @Input() selectCategories: Category[];
    @Input() catalogueIds: string[];
    @Input() catalogueUuids: string[];

    // identifier of the catalogue two which the images will be added. For now, it's not configurable but set to 'default'
    dropdownCatalogueId = 'default';
    // catalogue id specified by the user
    newCatalogueId = '';
    // flag keeping the state to use an existing catalogue or create a new one
    selectExistingCatalogue = true;
    selectedFileList: File[];

    // flags to show validation errors
    showCategoryWarning = false;
    showCatalogueUploadWarning = false;

    publishStatus: CallStatus;
    catalogueIdCallStatus: CallStatus;
    uploadPublishStatus: CallStatus[] = [];

    @ViewChild('template') uploadTemplateElement: ElementRef;

    constructor(private categoryService: CategoryService,
        private catalogueService: CatalogueService,
        private router: Router,
        private cookieService: CookieService,
        private translate: TranslateService) {
    }

    ngOnInit(): void {
        this.publishStatus = new CallStatus();
        this.catalogueIdCallStatus = new CallStatus();
        this.uploadPublishStatus = [];

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.catalogueIds) {
            // if there is no catalogue for the party, change the catalogue selection mode i.e. create new one
            if (!this.catalogueIds || this.catalogueIds.length === 0) {
                this.selectExistingCatalogue = false;
            } else {
                this.selectExistingCatalogue = true;
                this.dropdownCatalogueId = this.catalogueIds[0];
            }
        }
    }

    closeCategoryWarning(): void {
        this.showCategoryWarning = false;
    }

    closeUploadWarning(): void {
        this.showCatalogueUploadWarning = false;
    }

    checkMode(mode: string) {
        if (mode == "replace") {
            alert("Beware: All previously published items having the same categories specified in the template are deleted and only the new ones are added to the catalogue in replace mode!");
        }
    }

    downloadTemplate() {
        // first check whether there is at leasta one selected category
        if (this.selectCategories.length == 0) {
            this.showCategoryWarning = true;
            return;
        }

        this.publishStatus.submit();

        let userId: string = this.cookieService.get("user_id");
        var reader = new FileReader();
        this.catalogueService.downloadTemplate(userId, this.categoryService.selectedCategories, DEFAULT_LANGUAGE())
            .then(result => {
                var link = document.createElement('a');
                link.id = 'downloadLink';
                link.href = window.URL.createObjectURL(result.content);
                link.download = result.fileName;

                document.body.appendChild(link);
                var downloadLink = document.getElementById('downloadLink');
                downloadLink.click();
                document.body.removeChild(downloadLink);

                this.publishStatus.callback(this.translate.instant("Download completed"));
            },
                error => {
                    this.publishStatus.error(this.translate.instant("Download failed"));
                });
    }

    uploadTemplateClicked(): void {
        if (!this.validateCatalogueUpload()) {
            return;
        }

        const event = new MouseEvent('click', {bubbles: true});
        this.uploadTemplateElement.nativeElement.dispatchEvent(event);
    }

    uploadTemplateCallback(event: any, uploadMode: string) {
        let catalogueService = this.catalogueService;
        let userId: string = this.cookieService.get("user_id");
        let fileList: FileList = event.target.files;

        if (fileList.length > 0) {
            // initialize one call status for each uploaded file
            this.uploadPublishStatus = [];
            this.selectedFileList = [];
            for (let i = 0; i < fileList.length; i++) {
                this.uploadPublishStatus.push(new CallStatus());
                this.selectedFileList.push(fileList[i]);
            }

            let self = this;
            let callbackCount: number = 0;
            let errorCount: number = 0;
            for (let i = 0; i < this.selectedFileList.length; i++) {
                this.uploadPublishStatus[i].submit();
                let file: File = self.selectedFileList[i];
                var reader = new FileReader();
                reader.onload = (e) => {
                    let catalogueId = this.dropdownCatalogueId;
                    if (!this.selectExistingCatalogue) {
                        catalogueId = this.newCatalogueId;
                    }
                    catalogueService.uploadTemplate(userId, file, uploadMode, catalogueId).then(res => {
                        self.uploadPublishStatus[i].callback("Uploaded " + file.name + " successfully");
                        ProductPublishComponent.dialogBox = false;
                        self.resetEventWhenUploadCompletes(++callbackCount, self.selectedFileList.length, errorCount, event);
                    },
                    error => {
                        errorCount++;
                        self.uploadPublishStatus[i].error("Failed to upload: " + file.name, error);
                        self.resetEventWhenUploadCompletes(++callbackCount, self.selectedFileList.length, errorCount, event);
                    });
                };
                reader.readAsDataURL(self.selectedFileList[i]);
            }
        }
    }

    private resetEventWhenUploadCompletes(currentCount: number, totalCount: number, errorCount: number, event: any): void {
        if (currentCount == totalCount) {
            event.target.value = "";
        }
    }

    uploadImagePackage(event: any): void {
        this.publishStatus.submit();
        let catalogueService = this.catalogueService;
        let catalogueId = this.dropdownCatalogueId;
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            let self = this;
            var reader = new FileReader();
            reader.onload = function(e) {
                // reset the target value so that the same file could be chosen more than once
                event.target.value = "";
                catalogueService.uploadImageZipPackage(file, catalogueId).then(res => {
                    self.publishStatus.callback(res.message);
                },
                    error => {
                        self.publishStatus.error("Failed to upload the image package.", error);
                    });
            };
            reader.readAsDataURL(file);
        }
    }

    public navigateToCatalogueTab(): void {
        let catalogueUuid;
        if (!this.selectExistingCatalogue) {
            // retrieve the catalogue uuids again for the uuid of the new catalogue
            this.catalogueService.getCatalogueIdsUUidsForParty().then(catalogueIdsUuids => {
                for (let idUuid of catalogueIdsUuids) {
                    if (idUuid[0] === this.newCatalogueId) {
                        catalogueUuid = idUuid [1];
                        this.router.navigate(['dashboard'], {queryParams: {tab: 'CATALOGUE', cUuid: catalogueUuid}});
                    }
                }
            });
            return;

        } else {
            catalogueUuid = this.catalogueUuids[this.catalogueIds.findIndex(cId => cId === this.dropdownCatalogueId)];
            this.router.navigate(['dashboard'], {queryParams: {tab: 'CATALOGUE', cUuid: catalogueUuid}});
            return;
        }

        this.router.navigate(['dashboard'], {queryParams: {tab: 'CATALOGUE'}});
    }

    private validateCatalogueUpload(): boolean {
        let catalogueIdValid = true;
        if (!this.selectExistingCatalogue) {
            if (!this.newCatalogueId) {
                catalogueIdValid = false;
            }
        } else {
            if (!this.dropdownCatalogueId) {
                catalogueIdValid = false;
            }
        }

        if (!catalogueIdValid) {
            this.showCatalogueUploadWarning = true;
        } else {
            this.showCatalogueUploadWarning = false;
        }
        return catalogueIdValid;
    }
}
