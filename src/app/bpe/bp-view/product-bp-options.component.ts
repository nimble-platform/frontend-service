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
import {areLogisticsService, areTransportServices} from '../../common/utils';
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
import {DocumentService} from "./document-service";

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

    selectedLineIndex:number = 0;
    lines: CatalogueLine[];
    wrappers: ProductWrapper[];
    // options: BpWorkflowOptions;
    productWithSelectedProperties: Item;
    settings: CompanySettings;

    // Refers to the previous order document for transport related business processes.
    correspondingOrderOfTransportProcess?: Order;
    // The four variables below are used to represent a logistics service related information in case a previous order exists
    serviceLines?: CatalogueLine[];
    serviceWrappers?: ProductWrapper[];
    serviceWithSelectedProperties: Item;
    // serviceOptions?: BpWorkflowOptions;
    serviceSettings?: CompanySettings;

    productsExpanded: boolean[];
    serviceExpanded: boolean = false;
    // whether the process details are viewed for the product or not
    viewedProcessDetails:boolean[];
    public config = myGlobals.config;

    private identityEndpoint = myGlobals.user_mgmt_endpoint;
    chatURL = this.sanitizer.bypassSecurityTrustResourceUrl(myGlobals.rocketChatEndpoint);

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;
    // whether the item is deleted or not
    areCatalogueLinesDeleted:boolean[] = [] ;

    constructor(public bpDataService: BPDataService,
                public sanitizer: DomSanitizer,
                public catalogueService: CatalogueService,
                private searchContextService: SearchContextService,
                public userService: UserService,
                public bpeService: BPEService,
                private documentService: DocumentService,
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
     * @param productName
     */
    open(content, productName:string) {

        let createChannelRequest = {
            userId: this.cookieService.get("rocket_chat_userID"),
            userToken: this.cookieService.get("rocket_chat_token"),
            initiatingPartyID: this.cookieService.get("company_id"),
            respondingPartyID: this.bpDataService.getCompanySettings().companyID,
            productName: productName
        };

        if (createChannelRequest.initiatingPartyID == createChannelRequest.respondingPartyID && this.processMetadata) {
            createChannelRequest.initiatingPartyID = this.processMetadata.content.buyerPartyId;
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
            let sellerFederationId = routeParams['delegateId'];
            // Having bpDataService.bpActivityEvent null indicates that the page is (re)loaded directly.
            if (this.bpDataService.bpActivityEvent == null) {
                if (processInstanceId !== 'new') {
                    this.router.navigate([`bpe/bpe-sum/${processInstanceId}/${sellerFederationId}`], {skipLocationChange: true});
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

            const ids = bpActivityEvent.catalogueLineIds;
            const catalogueIds = bpActivityEvent.catalogueIds;
            const sellerFederationId = bpActivityEvent.sellerFederationId;
            this.bpDataService.precedingProcessId = bpActivityEvent.previousProcessInstanceId;
            this.bpDataService.precedingDocumentId = bpActivityEvent.previousDocumentId;
            this.bpDataService.precedingOrderId = bpActivityEvent.precedingOrderId;
            this.bpDataService.unShippedOrderIds = bpActivityEvent.unShippedOrderIds;

            if (this.id !== ids || this.catalogueId !== catalogueIds) {
                this.id = ids;
                this.catalogueId = catalogueIds;

                this.callStatus.submit();
                const userId = this.cookieService.get("user_id");
                Promise.all([
                    this.getCatalogueLines(catalogueIds, ids, bpActivityEvent.processMetadata,sellerFederationId),
                    this.getOrderForTransportService(bpActivityEvent.processMetadataOfAssociatedOrder),
                    this.userService.getSettingsForUser(userId)

                ]).then(([lines, order, currentUserSettings]) => {
                    this.lines = lines;
                    this.correspondingOrderOfTransportProcess = order;
                    this.bpDataService.productOrder = order;
                    this.bpDataService.currentUsersCompanySettings = currentUserSettings;

                    return Promise.all([
                        this.getReferencedCatalogueLines(lines, order),
                        this.userService.getSettingsForProduct(lines[0]),
                        this.bpDataService.bpActivityEvent.containerGroupId ? this.bpeService.checkCollaborationFinished(this.bpDataService.bpActivityEvent.containerGroupId,this.bpDataService.bpActivityEvent.processMetadata.sellerFederationId) : false
                    ])
                })
                .then(([referencedLines, sellerSettings, isCollaborationFinished]) => {
                    // updates the company's business process workflow in order to eliminate the unnecessary steps from the displayed flow
                    this.updateCompanyProcessWorkflowForThisProcess(isCollaborationFinished, sellerSettings);

                    // set the product line to be the first fetched line, either service or product.
                    this.bpDataService.setProductAndCompanyInformation(this.lines, sellerSettings);
                    this.productWithSelectedProperties = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;

                    // there is an order that references other products -> the line are services and the referencedLines are the original products
                    if (referencedLines) {
                        this.serviceLines = this.lines;
                        this.serviceWrappers = [];
                        for(let serviceLine of this.serviceLines){
                            this.serviceWrappers.push(new ProductWrapper(serviceLine, sellerSettings.negotiationSettings));
                        }
                        this.serviceSettings = sellerSettings;
                        this.serviceWithSelectedProperties = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;

                        this.lines = referencedLines;
                        this.productWithSelectedProperties = this.correspondingOrderOfTransportProcess.orderLine[0].lineItem.item;

                        this.setProductsExpandedAndViewedProcessDetailsArrays(false);
                        return this.userService.getSettingsForProduct(referencedLines[0]);

                    } else {
                        return Promise.resolve(sellerSettings);
                    }
                })
                .then(settings => {
                    // settings here always corresponds to the settings of the catalogue line either as the product itself being traded
                    // or the product ordered before a logistics related business process
                    this.wrappers = [];
                    for(let line of this.lines){
                        this.wrappers.push(new ProductWrapper(line, settings.negotiationSettings));
                    }
                    this.settings = settings;

                    if(this.processType) {
                        this.currentStep = this.getCurrentStep(this.processType);
                    }
                    this.stepsDisplayMode = this.getStepsDisplayMode();

                    this.setProductsExpandedAndViewedProcessDetailsArrays(false);
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

    onToggleProductExpanded(index:number) {
        let size = this.productsExpanded.length;
        for(let i = 0; i < size;i++){
            if(i == index){
                this.productsExpanded[index] = !this.productsExpanded[index];
            }
            else {
                this.productsExpanded[i] = false;
            }
        }

        this.selectedLineIndex = index;

        this.serviceExpanded = false;
    }

    onToggleServiceExpanded() {
        this.serviceExpanded = !this.serviceExpanded;
        this.setProductsExpandedAndViewedProcessDetailsArrays(false);
    }

    setProductsExpandedAndViewedProcessDetailsArrays(value:boolean){
        this.productsExpanded = [];
        this.viewedProcessDetails = [];
        for(let line of this.lines){
            this.productsExpanded.push(value);
            this.viewedProcessDetails.push(value);
        }
        // initially, we show the process details of first product
        this.viewedProcessDetails[0] = true;
    }

    areProcessDetailsViewedForAllProducts(){
        for(let viewedProcessDetails of this.viewedProcessDetails){
            if(!viewedProcessDetails){
                return false;
            }
        }
        return true;
    }

    getTitleForCheckIcon(){
        return "You have viewed the "+ this.currentStep.toLowerCase() +" details for this product";
    }

    getTitleForTimesIcon(){
        return "You have not viewed the "+ this.currentStep.toLowerCase() +" details for this product";
    }

    private isOrderDone(): boolean {
        return (this.processType === "Order" || this.processType === "Transport_Execution_Plan")
            && this.processMetadata
            && this.processMetadata.processStatus === "Completed";
    }

    private getOrderForTransportService(processMetadataOfAssociatedOrder:ThreadEventMetadata): Promise<Order | null> {
        if(this.bpDataService.bpActivityEvent.userRole === "seller") {
            return Promise.resolve(null);
        }
        // processMetadataOfAssociatedOrder has some value only when the user is navigated to the search for searching a transport service provider
        // for an existing order
        if(processMetadataOfAssociatedOrder) {
            return this.documentService.getInitialDocument(processMetadataOfAssociatedOrder.activityVariables,processMetadataOfAssociatedOrder.sellerFederationId);
        }
        if(this.processMetadata) {
            const processId = this.processMetadata.processInstanceId;
            return this.bpeService.getOriginalOrderForProcess(processId,this.processMetadata.sellerFederationId);
        }
        return Promise.resolve(null);
    }

    private getCurrentStep(processType: ProcessType): ProductBpStep {
        switch(processType) {
            case "Item_Information_Request":
                if(this.areTransportServices()) {
                    return "Transport_Information_Request";
                } else {
                    return "Item_Information_Request";
                }
            case "Ppap":
                return "Ppap";
            case "Negotiation":
                if(this.areTransportServices()) {
                    return "Transport_Negotiation";
                } else {
                    return "Negotiation";
                }
            case "Fulfilment":
                return "Fulfilment";
            case "Transport_Execution_Plan":
                return this.isOrderDone() ? "Transport_Order_Confirmed" : "Transport_Order";
            case "Order":
                if(this.areTransportServices()) {
                    return this.isOrderDone() ? "Transport_Order_Confirmed" : "Transport_Order";
                } else {
                    return this.isOrderDone() ? "Order_Confirmed" : "Order";
                }
        }
    }

    private areTransportServices(): boolean {
        return !!this.serviceLines || areTransportServices(this.lines);
    }

    private areLogisticsServices(): boolean {
        return !!this.serviceLines || areLogisticsService(this.lines);
    }

    private getStepsDisplayMode(): ProductBpStepsDisplay {
        if(this.areTransportServices()) {
            if(this.bpDataService.bpActivityEvent.processType == 'Transport_Execution_Plan' && this.bpDataService.bpActivityEvent.userRole === "seller") {
                // The service provider only sees transport steps
                return "Transport";
            } else if(!this.correspondingOrderOfTransportProcess) {
                // No original order: this is just a transport order without previous order from the customer
                return "Transport";
            } else {
                return "Transport_After_Order";
            }
        } else {
            if(this.areLogisticsServices()){
                return "Logistics";
            }
            if(this.bpDataService.bpActivityEvent.userRole === "seller") {
                return "Order_Before_Transport";
            } else {
                return "Order";
            }
        }
    }

    private getReferencedCatalogueLines(lines: CatalogueLine[], order: Order): Promise<CatalogueLine[]> {
        if(!this.hasReferencedCatalogueLines(lines, order)) {
            return Promise.resolve(null);
        }

        let catalogueUuids:string[] = [];
        let catalogueIds:string[] = [];

        for(let orderLine of order.orderLine){
            const item = orderLine.lineItem.item;
            const catalogueId = item.catalogueDocumentReference.id;
            const lineId = item.manufacturersItemIdentification.id;

            catalogueUuids.push(catalogueId);
            catalogueIds.push(lineId);
        }

        // create dummy catalogue lines for the deleted products using the corresponding item of the order
        return this.catalogueService.getLinesForDifferentCatalogues(catalogueUuids,catalogueIds,order.sellerSupplierParty.party.federationInstanceID).then(catalogueLines => {
            // update catalogueUuids and catalogueIds lists so that they keep only the identifiers for the deleted products
            for(let catalogueLine of catalogueLines){
                const catalogueId = catalogueLine.goodsItem.item.catalogueDocumentReference.id;
                const lineId = catalogueLine.goodsItem.item.manufacturersItemIdentification.id;

                catalogueUuids.splice(catalogueUuids.indexOf(catalogueId),1);
                catalogueIds.splice(catalogueIds.indexOf(lineId),1);
            }

            for(let orderLine of order.orderLine){
                const item = orderLine.lineItem.item;
                const catalogueId = item.catalogueDocumentReference.id;
                const lineId = item.manufacturersItemIdentification.id;
                // create dummy catalogue line for the deleted product
                if(catalogueUuids.indexOf(catalogueId) != -1 && catalogueIds.indexOf(lineId) != -1){
                    catalogueLines.push(UBLModelUtils.createCatalogueLineWithItemCopy(item));
                }
            }

            return catalogueLines;
        });
    }

    private hasReferencedCatalogueLines(lines: CatalogueLine[], order: Order): boolean {
        if(!order) {
            return false;
        }

        for(let orderLine of order.orderLine){
            const orderItem = orderLine.lineItem.item;
            const orderCatalogueId = orderItem.catalogueDocumentReference.id;
            const orderLineId = orderItem.manufacturersItemIdentification.id;
            for(let line of lines){
                const item = line.goodsItem.item;
                const catalogueId = item.catalogueDocumentReference.id;
                const lineId = item.manufacturersItemIdentification.id;

                if(orderCatalogueId !== catalogueId || orderLineId !== lineId){
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Retrieve catalogue line details via catalogue-service if the product exists.
     * Otherwise, create a simple catalogue line using the item inside the process metadata
     * */
    private async getCatalogueLines(catalogueUuids:string[], catalogueLineIds:string[], processMetadata:ThreadEventMetadata,sellerFederationId:string){

        let catalogueLines:CatalogueLine[] = [];

        let existingCatalogueUuids = [];
        let existingCatalogueLineIds = [];

        let catalogueLineSize = catalogueUuids.length;
        for(let i = 0; i < catalogueLineSize ; i++){
            let isProductDeleted = false;
            if(processMetadata){
                isProductDeleted = processMetadata.areProductsDeleted[i];
            }
            // create Catalogue line if it's deleted
            if(isProductDeleted){
                // catalogue line is deleted
                this.areCatalogueLinesDeleted.push(true);
                catalogueLines.push(UBLModelUtils.createCatalogueLineWithItemCopy(processMetadata.products[i]));
            }
            else{
                this.areCatalogueLinesDeleted.push(false);
                existingCatalogueUuids.push(catalogueUuids[i]);
                existingCatalogueLineIds.push(catalogueLineIds[i]);
            }
        }

        return this.catalogueService.getLinesForDifferentCatalogues(existingCatalogueUuids,existingCatalogueLineIds,sellerFederationId).then(existingCatalogueLines => {
            return catalogueLines.concat(existingCatalogueLines);
        })

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
