import {Component, Input} from "@angular/core";
import {CallStatus} from "../../common/call-status";
import {DEFAULT_LANGUAGE} from "../model/constants";
import {CategoryService} from "../category/category.service";
import {CatalogueService} from "../catalogue.service";
import {CookieService} from "ng2-cookies";
/**
 * Created by suat on 20-Mar-19.
 */
@Component({
    selector: "bulk-publish",
    templateUrl: "./bulk-publish.component.html",
    styleUrls: ["./bulk-publish.component.css"]
})
export class BulkPublishComponent {
    @Input() publishStatus:CallStatus;
    @Input() selectCategories:Category[];

    showCategoryWarning: boolean = false;

    constructor(private categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private cookieService: CookieService) {
    }

    closeCategoryWarning(): void {
        this.showCategoryWarning = false;
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
                catalogueService.uploadTemplate(userId, file, uploadMode).then(res => {
                        self.publishStatus.callback(null);
                        ProductPublishComponent.dialogBox = false;
                        self.router.navigate(['dashboard'], {queryParams: {tab: "CATALOGUE"}});
                    },
                    error => {
                        self.publishStatus.error("Failed to upload the template:  " + error);
                    });
            };
            reader.readAsDataURL(file);
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
                        self.publishStatus.callback(null);
                        ProductPublishComponent.dialogBox = false;
                        self.router.navigate(['dashboard'], {queryParams: {tab: "CATALOGUE"}});
                    },
                    error => {
                        self.publishStatus.error("Failed to upload the image package:  " + error);
                    });
            };
            reader.readAsDataURL(file);
        }
    }
}