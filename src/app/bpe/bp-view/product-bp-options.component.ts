import { Component, OnInit, OnDestroy, Renderer2 } from "@angular/core";
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
import { ProductBpStepsDisplay } from "./product-bp-steps-display";
import { isTransportService } from "../../common/utils";

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
    stepsDisplayMode: ProductBpStepsDisplay;
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
                public route: ActivatedRoute,
                private renderer: Renderer2) {
        this.renderer.setStyle(document.body, "background-image", "none");
    }

    ngOnInit() {
        this.processTypeSubs = this.bpDataService.processTypeObservable.subscribe(processType => {
            if (processType) {
                this.processType = processType;
                this.currentStep = this.getCurrentStep(processType);
                this.stepsDisplayMode = this.getStepsDisplayMode();
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
                        if(this.processType) {
                            this.currentStep = this.getCurrentStep(this.processType);
                        }
                        this.stepsDisplayMode = this.getStepsDisplayMode();
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
        this.renderer.setStyle(document.body, "background-image", "url('assets/bg_global.jpg')");
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

    private getStepsDisplayMode(): ProductBpStepsDisplay {
        if(isTransportService(this.line)) {
            if(this.bpDataService.userRole === "seller") {
                return "Transport";
            } else {
                // TODO check if there is an actual item attached to the order...
                return "Transport_After_Order";
            }
        } else {
            if(this.bpDataService.userRole === "seller") {
                return "Order_Before_Transport";
            } else {
                return "Order";
            }
        }
    }

    private getCurrentStep(processType: ProcessType): ProductBpStep {
        switch(processType) {
            case "Item_Information_Request":
                if(isTransportService(this.line)) {
                    return "Transport_Information_Request";
                } else {
                    return "Item_Information_Request";
                }
            case "Ppap":
                return "Ppap";
            case "Negotiation":
                if(isTransportService(this.line)) {
                    return "Transport_Negotiation";
                } else {
                    return "Negotiation";
                }
            case "Fulfilment":
                return "Fulfilment";
            case "Transport_Execution_Plan":
                return this.isOrderDone() ? "Transport_Order_Confirmed" : "Transport_Order";
            case "Order":
                return this.isOrderDone() ? "Order_Confirmed" : "Order";
        }
    }

    private isOrderDone(): boolean {
        return this.processType === "Order" 
            && this.bpDataService.processMetadata 
            && this.bpDataService.processMetadata.processStatus === "Completed";
    }

}
