import {Component, OnInit} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { ReceiptAdvice } from "../../../catalogue/model/publish/receipt-advice";

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "fulfilment",
    templateUrl: "./fulfilment.component.html"
})
export class FulfilmentComponent implements OnInit {
    
    line: CatalogueLine;

    constructor(private bpDataService:BPDataService) {

    }

    ngOnInit() {
        this.line = this.bpDataService.getCatalogueLine();
    }

    showReceiptAdvice(): boolean {
        return this.bpDataService.bpStartEvent.userRole === "buyer" || !!this.bpDataService.receiptAdvice;
    }
}