import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {CallStatus} from "../../../common/call-status";
import {CatalogueService} from "../../catalogue.service";
import {TranslateService} from '@ngx-translate/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'delete-export-catalogue-modal',
    templateUrl: './delete-export-catalogue-modal.component.html',
    styleUrls: ["./delete-export-catalogue-modal.component.css"]
})
export class DeleteExportCatalogueModalComponent {

    @Input() mode: 'delete' | 'export' | 'delete-images' | 'upload-image' = 'delete';
    private catalogueIds: string[] = []; // keeps list of identifiers of catalogues associated to the user party
    selectedIdMap: any = {}; // keeps catalogue id / boolean pairs as selected indicators
    catalogueRetrievalCallStatus: CallStatus = new CallStatus();
    catalogueOperationCallStatus: CallStatus = new CallStatus();
    enableMultipleSelection:boolean = true;
    @ViewChild("modal") modal: ElementRef;

    @Output() onSuccessfulDelete: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(private modalService: NgbModal,
                private catalogueService: CatalogueService,
                private translate: TranslateService) {
    }

    open(mode: 'delete' | 'export' | 'delete-images' | 'upload-image'): void {
        this.mode = mode;
        this.enableMultipleSelection = this.mode != 'upload-image';
        this.catalogueRetrievalCallStatus.submit();
        this.catalogueService.getCatalogueIdsForParty().then(ids => {
            this.catalogueIds = ids;
            for(let id of ids) {
                this.selectedIdMap[id] = false;
            }

            this.catalogueRetrievalCallStatus.callback(null, true);

        }).catch(error => {
            this.catalogueRetrievalCallStatus.error("Failed to retrieve catalogue ids for the party", error);
        });

        this.modalService.open(this.modal);
    }

    onIdSelection(selectedId:string){
        if(!this.enableMultipleSelection){
            for(let id of this.catalogueIds) {
                if(selectedId != id){
                    this.selectedIdMap[id] = false;
                }
            }
        }
    }
    onDeleteClicked(close: any) {
        let catalogueIdsToDelete: string[] = this.getSelectedCatalogueIds();
        if(catalogueIdsToDelete.length == 0) {
            this.resetModalAndClose(close);
            return;
        }

        this.catalogueOperationCallStatus.submit();
        this.catalogueService.deleteCatalogues(catalogueIdsToDelete).then(result => {
            this.onSuccessfulDelete.emit(true);
            this.catalogueOperationCallStatus.callback("Deleted catalogues successfully", true);
            this.resetModalAndClose(close);

        }).catch(error => {
           this.catalogueOperationCallStatus.error("Failed to delete catalogues", error);
        });
    }

    onDeleteImagesClicked(close: any) {
        let catalogueIdsToDelete: string[] = this.getSelectedCatalogueIds();
        if(catalogueIdsToDelete.length == 0) {
            this.resetModalAndClose(close);
            return;
        }

        this.catalogueOperationCallStatus.submit();
        this.catalogueService.deleteAllProductImagesInsideCatalogue(catalogueIdsToDelete).then(result => {
            this.onSuccessfulDelete.emit(true);
            this.catalogueOperationCallStatus.callback("Deleted catalogue images successfully", true);
            this.resetModalAndClose(close);

        }).catch(error => {
            this.catalogueOperationCallStatus.error("Failed to delete catalogue images", error);
        });
    }

    uploadImagePackage(event: any,close): void {
        let catalogueIdsToDelete: string[] = this.getSelectedCatalogueIds();
        if(catalogueIdsToDelete.length == 0) {
            this.resetModalAndClose(close);
            return;
        }
        this.catalogueOperationCallStatus.submit();
        let catalogueService = this.catalogueService;
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            let self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                // reset the target value so that the same file could be chosen more than once
                event.target.value = "";
                catalogueService.uploadZipPackage(file,catalogueIdsToDelete[0]).then(res => {
                        if (res.status == 200) {
                            self.catalogueOperationCallStatus.callback(null, true);
                            self.onSuccessfulDelete.emit(true);
                            self.resetModalAndClose(close);
                        } else if (res.status == 504) {
                            self.catalogueOperationCallStatus.callback(res.message);
                        }
                    },
                    error => {
                        self.catalogueOperationCallStatus.error("Failed to upload the image package.", error);
                    });
            };
            reader.readAsDataURL(file);
        }
    }

    onExportClicked(close: any) {
        let catalogueIdsToExport: string[] = this.getSelectedCatalogueIds();
        if(catalogueIdsToExport.length == 0) {
            this.resetModalAndClose(close);
            return;
        }

        this.catalogueOperationCallStatus.submit();
        this.catalogueService.exportCatalogues(catalogueIdsToExport).then(result => {
                    var link = document.createElement('a');
                    link.id = 'downloadLink';
                    link.href = window.URL.createObjectURL(result.content);
                    link.download = result.fileName;

                    document.body.appendChild(link);
                    var downloadLink = document.getElementById('downloadLink');
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    this.catalogueOperationCallStatus.callback("Exported catalogues successfully", true);
                    this.resetModalAndClose(close);
                },
                error => {
                    this.catalogueOperationCallStatus.error("Failed to export catalogue", error);
                });
    }

    private getSelectedCatalogueIds(): string[] {
        let selectedCatalogueIds: string[] = [];
        for(let id of Object.keys(this.selectedIdMap)) {
            if(this.selectedIdMap[id] == true) {
                selectedCatalogueIds.push(id);
            }
        }
        return selectedCatalogueIds;
    }

    private resetModalAndClose(close): void {
        this.selectedIdMap = {};
        this.catalogueIds = [];
        close();
    }
}
