import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CallStatus } from "../../common/call-status";
import { CatalogueService } from "../../catalogue/catalogue.service";
import { CatalogueLine } from "../../catalogue/model/publish/catalogue-line";
import { BPDataService } from "./bp-data-service";
import { Subscription } from "rxjs";
import { ProductBpStepStatus } from "./product-bp-step-status";
import { ProductWrapper } from "../../common/product-wrapper";
import { BpWorkflowOptions } from "../model/bp-workflow-options";
import { ProcessType } from "../model/process-type";
import { ProductBpStep } from "./product-bp-step";

/**
 * Created by suat on 20-Oct-17.
 */
@Component({
    selector: "product-bp-options",
    templateUrl: "./product-bp-options.component.html",
    styleUrls: ["./product-bp-options.component.css"]
})
export class ProductBpOptionsComponent implements OnInit, OnDestroy {
    processType: ProcessType;
    currentStep: ProductBpStep;
    callStatus: CallStatus = new CallStatus();
    processTypeSubs: Subscription;

    id: string;
    catalogueId: string;

    line: CatalogueLine;
    wrapper: ProductWrapper;
    options: BpWorkflowOptions;

    productExpanded: boolean = false;

    constructor(public bpDataService: BPDataService, 
                public catalogueService: CatalogueService, 
                public route: ActivatedRoute) {
        
    }

    ngOnInit() {
        this.processTypeSubs = this.bpDataService.processTypeObservable.subscribe(processType => {
            if (processType) {
                this.processType = processType;
                this.currentStep = this.getCurrentStep(processType);
            }
        });

        this.route.queryParams.subscribe(params => {
            const id = params["id"];
            const catalogueId = params["catalogueId"];
            this.bpDataService.precedingProcessId = params["pid"];

            if (this.id !== id || this.catalogueId !== catalogueId) {
                this.id = id;
                this.catalogueId = catalogueId;

                this.callStatus.submit();
                this.catalogueService
                    .getCatalogueLine(catalogueId, id)
                    .then(line => {
                        this.line = line;
                        this.wrapper = new ProductWrapper(line);
                        this.bpDataService.setCatalogueLines([line]);
                        this.callStatus.callback("Retrieved product details", true);
                        this.bpDataService.computeWorkflowOptions();
                        this.options = this.bpDataService.workflowOptions;
                    })
                    .catch(error => {
                        this.callStatus.error("Failed to retrieve product details");
                        console.log("Error while fetching catalogue", error);
                    });
            }
        });
    }

    ngOnDestroy(): void {
        this.processTypeSubs.unsubscribe();
    }

    getStepsStatus(): ProductBpStepStatus {
        return this.bpDataService.processMetadata ? this.bpDataService.processMetadata.status : "OPEN"
    }

    getStepsStatusText(): string {
        if(this.bpDataService.processMetadata) {
            return this.bpDataService.processMetadata.statusText;
        }
        return ""
    }

    private getCurrentStep(processType: ProcessType): ProductBpStep {
        switch(processType) {
            case "Item_Information_Request":
            case "Ppap":
            case "Negotiation":
            case "Fulfilment":
                return processType;
            case "Transport_Execution_Plan":
                // return a dummy step
                return "Item_Information_Request";
            case "Order":
                return this.isOrderDone() ? "OrderConfirmed" : "Order";
        }
    }

    private isOrderDone(): boolean {
        return this.processType === "Order" 
            && this.bpDataService.processMetadata 
            && this.bpDataService.processMetadata.processStatus === "Completed";
    }

}
