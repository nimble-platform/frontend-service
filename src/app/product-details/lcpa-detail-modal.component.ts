import {Component, ElementRef, EventEmitter, Output, ViewChild} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MultiTypeValue} from "../catalogue/model/publish/lcpa-input-detail";

@Component({
    selector: "lcpa-detail-modal",
    templateUrl: "./lcpa-detail-modal.component.html"
})
export class LcpaDetailModalComponent {

    @ViewChild("modal") modal: ElementRef;
    @Output() valueAdded = new EventEmitter<MultiTypeValue>();

    lcpaInputDetail: MultiTypeValue = new MultiTypeValue();
    presentationMode: "edit" | "view" = "edit";
    valueQualifiers = [
        { name: "Text", value: "STRING" },
        { name: "Quantity", value: "QUANTITY" },
    ];

    constructor(private modalService: NgbModal) {
    }

    open() {
        this.lcpaInputDetail = new MultiTypeValue();
        this.modalService.open(this.modal);
    }

    addDetail(c: any): void {
        this.valueAdded.emit(this.lcpaInputDetail);
        c();
    }
}
