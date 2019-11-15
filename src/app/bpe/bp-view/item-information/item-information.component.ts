import {Component, OnInit} from "@angular/core";
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
        if(this.bpDataService.bpActivityEvent.userRole == null) {
            this.router.navigate(['dashboard']);
        }
    }

    shouldShowResponse(): boolean {
        return !!this.bpDataService.itemInformationResponse || this.bpDataService.bpActivityEvent.userRole === "seller";
    }
}
