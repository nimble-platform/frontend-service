import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CallStatus } from "../../common/call-status";
import { CatalogueService } from "../../catalogue/catalogue.service";
import { CatalogueLine } from "../../catalogue/model/publish/catalogue-line";
import { BPDataService } from "./bp-data-service";
import { Subscription } from "rxjs";

/**
 * Created by suat on 20-Oct-17.
 */
@Component({
    selector: "product-bp-options",
    templateUrl: "./product-bp-options.component.html",
    styleUrls: ["./product-bp-options.component.css"]
})
export class ProductBpOptionsComponent implements OnInit, OnDestroy {
    currentStep: string;
    getCatalogueLineStatus: CallStatus = new CallStatus();
    processTypeSubs: Subscription;

    id: string;
    catalogueId: string;

    line: CatalogueLine;

    constructor(public bpDataService: BPDataService, 
                public catalogueService: CatalogueService, 
                public route: ActivatedRoute) {
        
    }

    ngOnInit() {
        this.processTypeSubs = this.bpDataService.processTypeObservable.subscribe(processType => {
            if (processType) {
                this.currentStep = processType;
            }
        });

        this.route.queryParams.subscribe(params => {
            const id = params["id"];
            const catalogueId = params["catalogueId"];
            this.bpDataService.precedingProcessId = params["pid"];

            if (this.id !== id || this.catalogueId !== catalogueId) {
                this.getCatalogueLineStatus.submit();
                this.catalogueService
                    .getCatalogueLine(catalogueId, id)
                    .then(line => {
                        this.line = line;
                        this.bpDataService.setCatalogueLines([line]);
                        this.getCatalogueLineStatus.callback("Retrieved product details", true);
                    })
                    .catch(error => {
                        this.getCatalogueLineStatus.error("Failed to retrieve product details");
                        console.log("Error while fetching catalogue", error);
                    });
            }
        });
    }

    getStepsStatus(): "OPEN" | "WAITING" | "TODO" | "DONE" {
        // TODO after the ux-updates branch has been merged, this will contain the data necessary to display the proper step.
        // console.log(this.bpDataService.processMetadata)

        if(!this.bpDataService.processMetadata) {
            return "OPEN";
        }

        if(this.bpDataService.processMetadata.statusCode === "COMPLETED") {
            return "DONE";
        }
        if(this.bpDataService.userRole === "buyer") {
            return "WAITING";
        } else {
            return "TODO";
        }
    }

    getStepsStatusText(): string {
        if(this.bpDataService.processMetadata) {
            return this.bpDataService.processMetadata.actionStatus;
        }
        return ""
    }

    ngOnDestroy(): void {
        this.processTypeSubs.unsubscribe();
    }
}
