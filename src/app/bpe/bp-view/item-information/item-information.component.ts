import { Component, OnInit } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { Router } from "@angular/router";

@Component({
    selector: "item-information",
    templateUrl: "./item-information.component.html",
    styleUrls: ["./item-information.component.css"]
})
export class ItemInformationComponent implements OnInit {

    constructor(private bpDataService: BPDataService, 
                private router: Router) {
        
    }

    ngOnInit() {
        if(this.bpDataService.bpStartEvent.userRole == null) {
            this.router.navigate(['dashboard']);
        }

        if(this.bpDataService.itemInformationRequest == null) {
            // initiating a new business process from scratch
            this.bpDataService.initItemInformationRequest();
        }
    }

    shouldShowResponse(): boolean {
        return !!this.bpDataService.itemInformationResponse || this.bpDataService.bpStartEvent.userRole === "seller";
    }
}
