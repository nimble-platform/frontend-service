import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { BPDataService } from "../bp-data-service";
import { INCOTERMS, PAYMENT_MEANS } from "../../../catalogue/model/constants";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { RequestForQuotationLine } from "../../../catalogue/model/publish/request-for-quotation-line";

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    line: CatalogueLine;
    rfq: RequestForQuotation;
    rfqLine: RequestForQuotationLine;

    negotiatedPriceAmount: number = 0;

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;

    // TODO remove these
    deliveryText: string = "";

    constructor(public bpDataService: BPDataService) {

    }

    ngOnInit() {
        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqLine = this.rfq.requestForQuotationLine[0];
        this.line = this.bpDataService.getCatalogueLine();

        // this.line = this.bpDataService.getCatalogueLine();
        // this.options = this.bpDataService.workflowOptions;
        // this.bpDataService.requestForQuotation.dataMonitoringRequested
        // this.bpDataService.requestForQuotation.delivery.deliveryTerms.incoterms
    }

    /*
     * Getters for the template.
     */

     getManufacturerWaranty(): string {
        const duration = this.line.warrantyValidityPeriod.durationMeasure.value;
        if(duration <= 0) {
            return "None";
        }
        return duration + " " + this.line.warrantyValidityPeriod.durationMeasure.unitCode;
     }

    //  getTotalPrice(): number {
    //     const price = this.line.requiredItemLocationQuantity.price;
    //     const amount = Number(price.priceAmount.value);
    //     return this.options.quantity * amount / price.baseQuantity.value;
    // }
}
