import { Component, OnInit, OnDestroy, Renderer2 } from "@angular/core";
import {ActivatedRoute, NavigationEnd, Params, Router} from "@angular/router";
import { CallStatus } from "../../common/call-status";
import { CatalogueService } from "../../catalogue/catalogue.service";
import { CatalogueLine } from "../../catalogue/model/publish/catalogue-line";
import { BPDataService } from "./bp-data-service";
import {Subscription} from "rxjs";
import { ProductBpStepStatus } from "./product-bp-step-status";
import { ProductWrapper } from "../../common/product-wrapper";
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
import {Headers, Http} from "@angular/http";
import { DomSanitizer } from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {UBLModelUtils} from '../../catalogue/model/ubl-model-utils';
import {Item} from "../../catalogue/model/publish/item";
import { AppComponent } from '../../app.component';

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
    bpActivityEventSubs: Subscription;

    id: string;
    catalogueId: string;

    line: CatalogueLine;
    wrapper: ProductWrapper;
    // options: BpWorkflowOptions;
    productWithSelectedProperties: Item;
    settings: CompanySettings;

    // Keeps the order document generated in the order process included in a business process collaboration
    // (i.e. the set of sequential processes). It also refers to the previous order document for transport related business processes.
    orderWithinCollaboration?: Order;
    // The four variables below are used to represent a logistics service related information in case a previous order exists
    serviceLine?: CatalogueLine;
    serviceWrapper?: ProductWrapper;
    serviceWithSelectedProperties: Item;
    // serviceOptions?: BpWorkflowOptions;
    serviceSettings?: CompanySettings;

    productExpanded: boolean = false;
    serviceExpanded: boolean = false;
    public config = myGlobals.config;

    private identityEndpoint = myGlobals.user_mgmt_endpoint;
    chatURL = this.sanitizer.bypassSecurityTrustResourceUrl(myGlobals.rocketChatEndpoint);

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;
    // whether the item is deleted or not
    isCatalogueLineDeleted:boolean = false ;

    constructor(public bpDataService: BPDataService,
                public sanitizer: DomSanitizer,
                public catalogueService: CatalogueService,
                private searchContextService: SearchContextService,
                public userService: UserService,
                public bpeService: BPEService,
                public route: ActivatedRoute,
                private router: Router,
                private cookieService: CookieService,
                private renderer: Renderer2,
                private translate: TranslateService,
                private http: Http,
                private modalService: NgbModal,
                public appComponent: AppComponent) {
        this.renderer.setStyle(document.body, "background-image", "none");
    }

    /**
     * This function will create a separate chat channel for business negotiations
     * @param content
     */
    open(content) {

        let createChannelRequest = {
            userId: this.cookieService.get("rocket_chat_userID"),
            userToken: this.cookieService.get("rocket_chat_token"),
            initiatingPartyID: this.cookieService.get("company_id"),
            respondingPartyID: this.bpDataService.getCompanySettings().companyID,
            productName: this.line.goodsItem.item.name[0].value
        };

        if (createChannelRequest.initiatingPartyID == createChannelRequest.respondingPartyID) {
            createChannelRequest.initiatingPartyID =  this.bpDataService.documentService.getBuyerParty()['id'];
        }

        let headers = new Headers({'Content-Type': 'application/json'});
        const url = `${this.identityEndpoint}/chat/createChannel`;
        this.http
            .post(url, JSON.stringify(createChannelRequest), {headers: headers})
            .toPromise()
            .then(res => {
                let channelDetails = res.json();
                this.chatURL = this.sanitizer.bypassSecurityTrustResourceUrl(myGlobals.rocketChatEndpoint + "/channel/" + channelDetails.channelName);
                this.appComponent.chatURL = this.chatURL;
                this.appComponent.chatVisible = true;
                //this.modalService.open(content, {})
            })
            .catch(e => {
                alert("Error occurred while creating the channel. Please try again later")
            })
    }

    ngOnInit() {
        // combineLatest(
        //     this.route.params, this.route.queryParams
        // ).pipe(
        //     map(([pathParams, queryParams]) => ({...pathParams, ...queryParams}))
        // )

        // Upon a change in the route param i.e. when the user is navigated to this page, (s)he is redirect to the
        // bpe/bpe-sum endpoint (ThreadSummaryComponent) if the bpDataService.bpActivityEvent variable is not set.
        // This case occurs when the user opens a business process with a direct link (e.g. <base_url>/bpe/bpe-exec/<process_instance_id>
        // by (re)loading the page. In  this case, the rest of the flow to view a process is as follows:
        // 1) bpe-sum fetches the necessary information to display the details of the business process
        // 2) BpDataService's startBp method is called, which initiates the bpDataService.bpActivity field and redirects the navigation
        // to the bpe-exec (this page)
        //
        // In cases where the business process is viewed within the application, e.g. by navigating from the dashboard,
        // bpDataService.bpActivityEvent is set, which would eliminate the redirecting to the bpe-sum endpoint.
        //
        // As another side note, switches between the business process steps, e.g. from negotiation to order, is realized by calling the
        // BpDataService's proceedNextBpStep method.
        this.route.params.subscribe(routeParams => {
            let processInstanceId = routeParams['processInstanceId'];
            // Having bpDataService.bpActivityEvent null indicates that the page is (re)loaded directly.
            if (this.bpDataService.bpActivityEvent == null) {
                if (processInstanceId !== 'new') {
                    this.router.navigate([`bpe/bpe-sum/${processInstanceId}`], {skipLocationChange: true});
                } else {
                    this.router.navigate(['dashboard']);
                }
            }
        });

        this.bpActivityEventSubs = this.bpDataService.bpActivityEventObservable.subscribe(bpActivityEvent => {
            // we do this null check since the observable is initialized with a null event
            if (bpActivityEvent == null) {
                return;
            }

            // get copy of ThreadEventMetadata of the current business process
            this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

            if (this.bpDataService.bpActivityEvent.newProcess) {
                this.processMetadata = null;
            }
            this.processType = bpActivityEvent.processType;
            this.currentStep = this.getCurrentStep(bpActivityEvent.processType);
            this.stepsDisplayMode = this.getStepsDisplayMode();

            const id = bpActivityEvent.catalogueLineId;
            const catalogueId = bpActivityEvent.catalogueId;
            this.bpDataService.precedingProcessId = bpActivityEvent.previousProcessInstanceId;
            this.bpDataService.precedingDocumentId = bpActivityEvent.previousDocumentId;

            if (this.id !== id || this.catalogueId !== catalogueId) {
                this.id = id;
                this.catalogueId = catalogueId;

                this.callStatus.submit();
                const userId = this.cookieService.get("user_id");
                Promise.all([
                    this.getCatalogueLine(catalogueId, id, bpActivityEvent.processMetadata),
                    this.getOrderWithinCollaboration(),
                    this.userService.getSettingsForUser(userId)

                ]).then(([line, order, ownCompanySettings]) => {
                    this.line = line;
                    this.orderWithinCollaboration = order;
                    this.bpDataService.productOrder = order;
                    // this.setC
                    this.bpDataService.currentUserSettings = ownCompanySettings;

                    return Promise.all([
                        this.getReferencedCatalogueLine(line, order),
                        this.userService.getSettingsForProduct(line),
                        this.bpDataService.bpActivityEvent.containerGroupId ? this.bpeService.checkCollaborationFinished(this.bpDataService.bpActivityEvent.containerGroupId) : false
                    ])
                })
                .then(([referencedLine, sellerSettings, isCollaborationFinished]) => {
                    // updates the company's business process workflow in order to eliminate the unnecessary steps from the displayed flow
                    this.updateCompanyProcessWorkflowForThisProcess(isCollaborationFinished, sellerSettings);

                    // set the product line to be the first fetched line, either service or product.
                    this.bpDataService.setProductAndCompanyInformation([this.line], sellerSettings);
                    this.productWithSelectedProperties = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
                    //this.bpDataService.computeWorkflowOptions();

                    // there is an order that references another product -> the line is a service and the referencedLine is the original product
                    if (referencedLine) {
                        this.serviceLine = this.line;
                        this.serviceWrapper = new ProductWrapper(this.serviceLine, sellerSettings.negotiationSettings);
                        this.serviceSettings = sellerSettings;
                        // this.serviceOptions = this.bpDataService.bpActivityEvent.workflowOptions;
                        this.serviceWithSelectedProperties = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;

                        this.line = referencedLine;
                        this.productWithSelectedProperties = this.orderWithinCollaboration.orderLine[0].lineItem.item;

                        return this.userService.getSettingsForProduct(referencedLine);

                    } else {
                        return Promise.resolve(sellerSettings);
                    }
                })
                .then(settings => {
                    // settings here always corresponds to the settings of the catalogue line either as the product itself being traded
                    // or the product ordered before a logistics related business process
                    this.wrapper = new ProductWrapper(this.line, settings.negotiationSettings);
                    this.settings = settings;

                    // this.options = this.bpDataService.bpActivityEvent.workflowOptions;
                    if(this.processType) {
                        this.currentStep = this.getCurrentStep(this.processType);
                    }
                    this.stepsDisplayMode = this.getStepsDisplayMode();

                    this.callStatus.callback("Retrieved product details", true);
                })
                .catch(error => {
                    this.callStatus.error("Failed to retrieve product details", error);
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.bpActivityEventSubs.unsubscribe();
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
        return !(this.processMetadata && this.processMetadata.isBeingUpdated) || this.bpDataService.bpActivityEvent.processType == 'Fulfilment' || this.bpDataService.bpActivityEvent.processType == 'Transport_Execution_Plan';
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

    private getOrderWithinCollaboration(): Promise<Order | null> {
        if(this.bpDataService.bpActivityEvent.userRole === "seller") {
            return Promise.resolve(null);
        }
        if(this.searchContextService.getAssociatedProcessMetadata()) {
            const processId = this.searchContextService.getAssociatedProcessMetadata().processInstanceId;
            return this.bpeService.getOriginalOrderForProcess(processId)
        }
        if(this.processMetadata) {
            const processId = this.processMetadata.processInstanceId;
            return this.bpeService.getOriginalOrderForProcess(processId);
        }
        return Promise.resolve(null);
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
            if(this.bpDataService.bpActivityEvent.processType == 'Transport_Execution_Plan' && this.bpDataService.bpActivityEvent.userRole === "seller") {
                // The service provider only sees transport steps
                return "Transport";
            } else if(!this.orderWithinCollaboration) {
                // No original order: this is just a transport order without previous order from the customer
                return "Transport";
            } else {
                return "Transport_After_Order";
            }
        } else {
            if(this.isLogisticsService()){
                return "Logistics";
            }
            if(this.bpDataService.bpActivityEvent.userRole === "seller") {
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

    /**
     * Retrieve catalogue line details via catalogue-service if the product exists.
     * Otherwise, create a simple catalogue line using the item inside the process metadata
     * */
    private async getCatalogueLine(catalogueUuid:string, catalogueLineId:string, processMetadata:ThreadEventMetadata){

        let isProductDeleted = false;
        if(processMetadata){
            isProductDeleted = processMetadata.isProductDeleted;
        }
        // create Catalogue line if it's deleted
        if(isProductDeleted){
            // catalogue line is deleted
            this.isCatalogueLineDeleted = true;
            return UBLModelUtils.createCatalogueLineWithItemCopy(processMetadata.product);
        }
        else{
            // retrieve catalogue line if exists
            return this.catalogueService.getCatalogueLine(catalogueUuid, catalogueLineId).then( catalogueLine => {
                return catalogueLine;
            });
        }
    }

    private updateCompanyProcessWorkflowForThisProcess(isCollaborationFinished: boolean, settings: CompanySettings): void {
        // if the collaboration is finished, we need to update workflow since it could be different from the current one
        // we will retrieve process ids from the process history and use those ids to create new workflow
        if (isCollaborationFinished) {
            let companyWorkflow = [];
            let size = this.bpDataService.bpActivityEvent.processHistory.length;
            for (let i = size - 1; i > -1; i--) {
                let processType = this.bpDataService.bpActivityEvent.processHistory[i].processType;
                if (companyWorkflow.indexOf(processType) === -1) {
                    companyWorkflow.push(processType);
                }
            }
            // update the workflow of company
            settings.negotiationSettings.company.processID = companyWorkflow;
        }
    }
}
