import { Component, OnInit } from "@angular/core";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { Router } from "@angular/router";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { NegotiationModelWrapper } from "./negotiation-model-wrapper";

@Component({
    selector: "negotiation-response",
    templateUrl: "./negotiation-response.component.html",
    styleUrls: ["./negotiation-response.component.css"],
})
export class NegotiationResponseComponent implements OnInit {

    
    line: CatalogueLine;
    rfq: RequestForQuotation;
    quotation: Quotation;
    wrapper: NegotiationModelWrapper;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private router: Router) {
        
    }

    ngOnInit() {
        this.line = this.bpDataService.getCatalogueLine();
        this.rfq = this.bpDataService.requestForQuotation;
        this.quotation = this.bpDataService.quotation;
        this.wrapper = new NegotiationModelWrapper(this.line, this.rfq, this.quotation);
    }
}
