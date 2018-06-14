import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})

export class NegotiationComponent implements OnInit {
    // this is temporary
    selectedTab: "Request" | "Response" = "Request";
    @Input() line: CatalogueLine;

    constructor(private bpDataService:BPDataService) {
    }

    ngOnInit() {
		if(this.bpDataService.requestForQuotation == null) {
			this.bpDataService.initRfq();
		}
        
        // this.bpDataService.userRole = "Buyer" | "Seller"
	}

    
}