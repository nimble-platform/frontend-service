import {Component, ElementRef, EventEmitter, Output, ViewChild} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MultiTypeValue} from "../catalogue/model/publish/multi-type-value";
import {Quantity} from "../catalogue/model/publish/quantity";
import {Text} from "../catalogue/model/publish/text";

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
        this.lcpaInputDetail.valueQuantity.push(new Quantity());
        this.lcpaInputDetail.valueDecimal.push(undefined);
        this.lcpaInputDetail.value.push(new Text());
        this.modalService.open(this.modal);
    }

    addDetail(c: any): void {
        this.valueAdded.emit(this.lcpaInputDetail);
        c();
    }
}
