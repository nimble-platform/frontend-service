import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})

export class NegotiationComponent implements OnInit {

    @Input() line: CatalogueLine;

    constructor(private bpDataService:BPDataService) {
    }

    ngOnInit() {
		if(this.bpDataService.requestForQuotation == null) {
			this.bpDataService.initRfq();
        }
        
        console.log("quotation: ", this.bpDataService.quotation);

        // this.bpDataService.quotation
        // this.bpDataService.requestForQuotation
        // this.bpDataService.userRole = "Buyer" | "Seller"
	}

    
}