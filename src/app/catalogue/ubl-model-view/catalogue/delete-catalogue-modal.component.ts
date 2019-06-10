import {Component, ElementRef, EventEmitter, Output, ViewChild} from "@angular/core";
import {CallStatus} from "../../../common/call-status";
import {CatalogueService} from "../../catalogue.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'delete-catalogue-modal',
    templateUrl: './delete-catalogue-modal.component.html',
    styleUrls: ["./delete-catalogue-modal.component.css"]
})
export class DeleteCatalogueModalComponent {

    private catalogueIds: string[] = []; // keeps list of identifiers of catalogues associated to the user party
    selectedIdMap: any = {}; // keeps catalogue id / boolean pairs as selected indicators
    catalogueRetrievalCallStatus: CallStatus = new CallStatus();
    catalogueDeleteCallStatus: CallStatus = new CallStatus();
    @ViewChild("modal") modal: ElementRef;

    @Output() onSuccessfulDelete: EventEmitter = new EventEmitter();

    constructor(private modalService: NgbModal,
                private catalogueService: CatalogueService) {
    }

    open(): void {
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

    onDeleteClicked(close: any) {
        let catalogueIdsToDelete: string[] = [];
        for(let id of Object.keys(this.selectedIdMap)) {
            if(this.selectedIdMap[id] == true) {
                catalogueIdsToDelete.push(id);
            }
        }

        if(catalogueIdsToDelete.length == 0) {
            this.resetModalAndClose(close);
            return;
        }

        this.catalogueDeleteCallStatus.submit();
        this.catalogueService.deleteCataloguesForParty(catalogueIdsToDelete).then(result => {
            this.onSuccessfulDelete.emit(true);
            this.resetModalAndClose(close);

        }).catch(error => {
           this.catalogueDeleteCallStatus.error("Failed to delete catalogues", error);
        });
    }

    private resetModalAndClose(close): void {
        this.selectedIdMap = {};
        this.catalogueIds = [];
        close();
    }
}
