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
import {isLogisticsService, isTransportService} from '../../common/utils';
import { UserService } from "../../user-mgmt/user.service";
import { CompanySettings } from "../../user-mgmt/model/company-settings";
import { BPEService } from "../bpe.service";
import { Order } from "../../catalogue/model/publish/order";
import { SearchContextService } from "../../simple-search/search-context.service";
import { CookieService } from "ng2-cookies";
import {ThreadEventMetadata} from '../../catalogue/model/publish/thread-event-metadata';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from '../../globals';
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
    bpStartEventSubs: Subscription;

    id: string;
    catalogueId: string;

    line: CatalogueLine;
    wrapper: ProductWrapper;
    options: BpWorkflowOptions;
    settings: CompanySettings;

    originalOrder?: Order;
    serviceLine?: CatalogueLine;
    serviceWrapper?: ProductWrapper;
    serviceSettings?: CompanySettings;

    productExpanded: boolean = false;
    serviceExpanded: boolean = false;
    public config = myGlobals.config;

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    constructor(public bpDataService: BPDataService, 
                public catalogueService: CatalogueService, 
                private searchContextService: SearchContextService,
                public userService: UserService,
                public bpeService: BPEService,
                public route: ActivatedRoute,
                private cookieService: CookieService,
                private renderer: Renderer2,
                private modalService: NgbModal) {
        this.renderer.setStyle(document.body, "background-image", "none");
    }

    open(content) {
        this.modalService.open(content, {}).result.then((result) => {
            // this.closeResult = `Closed with: ${result}`;
        }, (reason) => {
            // this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        this.bpStartEventSubs = this.bpDataService.bpStartEventObservable.subscribe(bpStartEvent => {
            if (bpStartEvent) {
                this.processType = bpStartEvent.processType;
                this.currentStep = this.getCurrentStep(bpStartEvent.processType);
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
                const userId = this.cookieService.get("user_id");
                Promise.all([
                    this.catalogueService.getCatalogueLine(catalogueId, id),
                    this.getOriginalOrder(),
                    this.userService.getSettingsForUser(userId)
                ]).then(([line, order, ownCompanySettings]) => {
                    this.line = line;
                    this.originalOrder = order;
                    this.bpDataService.productOrder = order;
                    this.bpDataService.currentUserSettings = ownCompanySettings;

                    return Promise.all([
                        this.getReferencedCatalogueLine(line, order),
                        this.userService.getSettingsForProduct(line)
                    ])
                })
                .then(([referencedLine, settings]) => {
                    // set the product line to be the first fetched line, either service or product.
                    this.bpDataService.setCatalogueLines([this.line], [settings]);
                    this.bpDataService.computeWorkflowOptions();
                    
                    // there is an order that references another product -> the line is a service and the referencedLine is the original product
                    if(referencedLine) {
                        this.serviceLine = this.line;
                        this.serviceWrapper = new ProductWrapper(this.serviceLine, settings.negotiationSettings);
                        this.serviceSettings = settings;
                        this.line = referencedLine;
                        return this.userService.getSettingsForProduct(referencedLine);
                    }

                    this.initWithCatalogueLine(this.line, settings);
                    return null;
                })
                .then(settings => {
                    if(settings) {
                        this.initWithCatalogueLine(this.line, settings);
                    }
                    this.callStatus.callback("Retrieved product details", true);
                })
                .catch(error => {
                    this.callStatus.error("Failed to retrieve product details", error);
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.bpStartEventSubs.unsubscribe();
        this.renderer.setStyle(document.body, "background-image", "url('assets/bg_global.jpg')");
    }

    getStepsStatus(): ProductBpStepStatus {
        return this.processMetadata ? this.processMetadata.status : "OPEN"
    }

    getStepsStatusText(): string {
        if(this.processMetadata) {
            return this.processMetadata.statusText;
        }
        return ""
    }

    isReadOnly(): boolean {
        return !(this.processMetadata && this.processMetadata.isBeingUpdated) || this.bpDataService.bpStartEvent.processType == 'Fulfilment' || this.bpDataService.bpStartEvent.processType == 'Transport_Execution_Plan';
    }

    onToggleProductExpanded() {
        this.productExpanded = !this.productExpanded;
        this.serviceExpanded = false;
    }

    onToggleServiceExpanded() {
        this.serviceExpanded = !this.serviceExpanded;
        this.productExpanded = false;
    }

    private isOrderDone(): boolean {
        return (this.processType === "Order" || this.processType === "Transport_Execution_Plan")
            && this.processMetadata
            && this.processMetadata.processStatus === "Completed";
    }

    private getOriginalOrder(): Promise<Order | null> {
        if(this.bpDataService.bpStartEvent.userRole === "seller") {
            return Promise.resolve(null);
        }
        if(this.searchContextService.getAssociatedProcessMetadata()) {
            const processId = this.searchContextService.getAssociatedProcessMetadata().processId;
            return this.bpeService.getOriginalOrderForProcess(processId)
        }
        if(this.processMetadata) {
            const processId = this.processMetadata.processId;
            return this.bpeService.getOriginalOrderForProcess(processId);
        }
        return Promise.resolve(null);
    }

    private initWithCatalogueLine(line: CatalogueLine, settings: CompanySettings) {
        this.wrapper = new ProductWrapper(line, settings.negotiationSettings);
        this.settings = settings;
        this.options = this.bpDataService.bpStartEvent.workflowOptions;
        if(this.processType) {
            this.currentStep = this.getCurrentStep(this.processType);
        }
        this.stepsDisplayMode = this.getStepsDisplayMode();
    }

    private getCurrentStep(processType: ProcessType): ProductBpStep {
        switch(processType) {
            case "Item_Information_Request":
                if(this.isTransportService()) {
                    return "Transport_Information_Request";
                } else {
                    return "Item_Information_Request";
                }
            case "Ppap":
                return "Ppap";
            case "Negotiation":
                if(this.isTransportService()) {
                    return "Transport_Negotiation";
                } else {
                    return "Negotiation";
                }
            case "Fulfilment":
                return "Fulfilment";
            case "Transport_Execution_Plan":
                return this.isOrderDone() ? "Transport_Order_Confirmed" : "Transport_Order";
            case "Order":
                if(this.isTransportService()) {
                    return this.isOrderDone() ? "Transport_Order_Confirmed" : "Transport_Order";
                } else {
                    return this.isOrderDone() ? "Order_Confirmed" : "Order";
                }
        }
    }

    private isTransportService(): boolean {
        return !!this.serviceLine || isTransportService(this.line);
    }

    private isLogisticsService(): boolean {
        return !!this.serviceLine || isLogisticsService(this.line);
    }

    private getStepsDisplayMode(): ProductBpStepsDisplay {
        if(this.isTransportService()) {
            if(this.bpDataService.bpStartEvent.userRole === "seller") {
                // The service provider only sees transport steps
                return "Transport";
            } else if(!this.originalOrder) {
                // No original order: this is just a transport order without previous order from the customer
                return "Transport";
            } else {
                return "Transport_After_Order";
            }
        } else {
            if(this.isLogisticsService()){
                return "Logistics";
            }
            if(this.bpDataService.bpStartEvent.userRole === "seller") {
                return "Order_Before_Transport";
            } else {
                return "Order";
            }
        }
    }

    private getReferencedCatalogueLine(line: CatalogueLine, order: Order): Promise<CatalogueLine> {
        if(!this.hasReferencedCatalogueLine(line, order)) {
            return Promise.resolve(null);
        }

        const item = order.orderLine[0].lineItem.item;
        const catalogueId = item.catalogueDocumentReference.id;
        const lineId = item.manufacturersItemIdentification.id;

        return this.catalogueService.getCatalogueLine(catalogueId, lineId)
    }

    private hasReferencedCatalogueLine(line: CatalogueLine, order: Order): boolean {
        if(!order) {
            return false;
        }

        const orderItem = order.orderLine[0].lineItem.item;
        const orderCatalogueId = orderItem.catalogueDocumentReference.id;
        const orderLineId = orderItem.manufacturersItemIdentification.id;

        const item = line.goodsItem.item;
        const catalogueId = item.catalogueDocumentReference.id;
        const lineId = item.manufacturersItemIdentification.id;

        return orderCatalogueId !== catalogueId || orderLineId !== lineId;
    }


}
