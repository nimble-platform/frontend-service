import {Component, Input} from "@angular/core";
import {CallStatus} from "../../common/call-status";
import {DEFAULT_LANGUAGE} from "../model/constants";
import {CategoryService} from "../category/category.service";
import {CatalogueService} from "../catalogue.service";
import {CookieService} from "ng2-cookies";
import {Category} from '../model/category/category';
import {ProductPublishComponent} from './product-publish.component';
import {Router} from '@angular/router';
/**
 * Created by suat on 20-Mar-19.
 */
@Component({
    selector: "bulk-publish",
    templateUrl: "./bulk-publish.component.html",
    styleUrls: ["./bulk-publish.component.css"]
})
export class BulkPublishComponent {
    @Input() selectCategories:Category[];

    publishStatus:CallStatus = new CallStatus();
    showCategoryWarning: boolean = false;
    uploadPublishStatus: CallStatus[] = [];
    selectedFileList: File[];

    constructor(private categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private router: Router,
                private cookieService: CookieService) {
    }

    closeCategoryWarning(): void {
        this.showCategoryWarning = false;
    }

    checkMode(mode: string) {
        if (mode == "replace") {
            alert("Beware: All previously published items having the same categories specified in the template are deleted and only the new ones are added to the catalogue in replace mode!");
        }
    }

    downloadTemplate() {
        // first check whether there is at leasta one selected category
        if(this.selectCategories.length == 0) {
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

                    this.publishStatus.callback("Download completed");
                },
                error => {
                    this.publishStatus.error("Download failed");
                });
    }

    uploadTemplate(event: any, uploadMode: string) {
        let catalogueService = this.catalogueService;
        let userId: string = this.cookieService.get("user_id");
        let fileList: FileList = event.target.files;

        if (fileList.length > 0) {
            // initialize one call status for each uploaded file
            this.uploadPublishStatus = [];
            this.selectedFileList = [];
            for(let i=0; i<fileList.length; i++) {
                this.uploadPublishStatus.push(new CallStatus());
                this.selectedFileList.push(fileList[i]);
            }

            let self = this;
            let callbackCount: number = 0;
            let errorCount: number = 0;
            for(let i=0; i<this.selectedFileList.length; i++) {
                this.uploadPublishStatus[i].submit();
                let file:File = self.selectedFileList[i];
                var reader = new FileReader();
                reader.onload = function (e) {
                    catalogueService.uploadTemplate(userId, file, uploadMode).then(res => {
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
        if(currentCount == totalCount) {
            event.target.value = "";
            if(errorCount == 0) {
                this.navigateToCatalogueTab();
            }
        }
    }

    uploadImagePackage(event: any): void {
        this.publishStatus.submit();
        let catalogueService = this.catalogueService;
        let userId: string = this.cookieService.get("user_id");
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            let self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                // reset the target value so that the same file could be chosen more than once
                event.target.value = "";
                catalogueService.uploadZipPackage(file).then(res => {
                        self.publishStatus.callback(res.message);
                    },
                    error => {
                        self.publishStatus.error("Failed to upload the image package.", error);
                    });
            };
            reader.readAsDataURL(file);
        }
    }

    public navigateToCatalogueTab():void {
        this.router.navigate(['dashboard'], {queryParams: {tab: "CATALOGUE"}});
    }
}