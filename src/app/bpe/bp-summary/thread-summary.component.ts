/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ProcessInstanceGroup } from "../model/process-instance-group";
import {ActivatedRoute, Router} from "@angular/router";
import { BPDataService } from "../bp-view/bp-data-service";
import { BPEService } from "../bpe.service";
import { ActivityVariableParser } from "../bp-view/activity-variable-parser";
import * as moment from "moment";
import { CallStatus } from "../../common/call-status";
import { CookieService } from "ng2-cookies";
import { DataChannelService } from "../../data-channel/data-channel.service";
import { ProcessType } from "../model/process-type";
import { ThreadEventMetadata } from "../../catalogue/model/publish/thread-event-metadata";
import { ThreadEventStatus } from "../../catalogue/model/publish/thread-event-status";
import { SearchContextService } from "../../simple-search/search-context.service";
import {DocumentService} from "../bp-view/document-service";
import { EvidenceSupplied } from "../../catalogue/model/publish/evidence-supplied";
import { Comment } from "../../catalogue/model/publish/comment";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Code } from "../../catalogue/model/publish/code";
import {BpUserRole} from '../model/bp-user-role';
import {BpActivityEvent} from '../../catalogue/model/publish/bp-start-event';
import {UBLModelUtils} from '../../catalogue/model/ubl-model-utils';
import {selectPreferredValue} from '../../common/utils';
import {DashboardProcessInstanceDetails} from '../model/dashboard-process-instance-details';
import {Item} from '../../catalogue/model/publish/item';
import {NEGOTIATION_RESPONSES} from "../../catalogue/model/constants";
import {DataChannel} from '../../data-channel/model/datachannel';
import * as myGlobals from "../../globals";
import {UserService} from '../../user-mgmt/user.service';
import { AppComponent } from "../../app.component";
import { TranslateService } from "@ngx-translate/core";
import {Subject} from 'rxjs';
import {CatalogueService} from '../../catalogue/catalogue.service';

@Component({
    selector: 'thread-summary',
    templateUrl: './thread-summary.component.html',
    styleUrls: ['./thread-summary.component.css']
})
export class ThreadSummaryComponent implements OnInit {

    @Input() processInstanceGroup: ProcessInstanceGroup;
    @Input() collaborationGroupId: string;
    @Output() threadStateUpdated = new EventEmitter();
    @Output() threadStateUpdatedNoChange = new EventEmitter();

    routeProcessInstanceId: string; // a non-null value indicates that the page is loaded directly i.e. not via the dashboard and the user should be
                                    // redirected to the details of the process instance

    titleEvent: ThreadEventMetadata; // keeps information about the summary the collaboration
    lastEvent: ThreadEventMetadata; // the last event in the collaboration
    lastEventPartnerID = null;
    lastEventPartnerFederationId = null;

    // History of events
    hasHistory: boolean = false;
    completeHistory: ThreadEventMetadata[]; // keeps all the event metadata included in the collaboration
    history: ThreadEventMetadata[]; // keeps all the event metadata included in the collaboration except the last one
    historyExpanded: boolean = false;

    ratingOverall = 0;
    ratingSeller = 0;
    ratingFulfillment = 0;

    sellerNegoSettings = null;

    // the status (i.e., the product exists or not) of products included in the thread
    productsStatus:boolean[] = null;

    productPartyStatusPromise:Promise<any> = null;

    // Utilities
    eventCount: number = 0;
    collaborationGroupRetrievalCallStatus: CallStatus = new CallStatus();
    archiveCallStatus: CallStatus = new CallStatus();
    fetchCallStatus: CallStatus = new CallStatus();
    saveCallStatusRating: CallStatus = new CallStatus();
    showDataChannelButton: boolean = false;
    enableDataChannelButton: boolean = false;
    channelLink = "";
    compRating: any = {
      "QualityOfTheNegotiationProcess": 0,
      "QualityOfTheOrderingProcess": 0,
      "ResponseTime": 0,
      "ProductListingAccuracy": 0,
      "ConformanceToOtherAgreedTerms": 0,
      "DeliveryAndPackaging": 0
    };
    compComment: any = [];

    // Rate attributes

    negotiationQuality = false;
    orderQuality = false;
    responsetime= false;
    prodListingAccu = false;
    conformToOtherAggre = false;
    deliveryPackage = false;

    // this is always true unless an approved order is present in this process group or the collaboration is already cancelled
    showCancelCollaborationButton = true;
    // as long as the collaboration is not finished/cancelled and all processes in the group are completed , it's true
    showFinishCollaborationButton = true;
    // this is always false unless the collaboration was cancelled or fully completed (buyer side only)
    showRateCollaborationButton = false;
    expanded: boolean = false;

    tradingPartnerName:string = null;

    config = myGlobals.config;
    selectPreferredValue = selectPreferredValue;

    ngUnsubscribe: Subject<void> = new Subject<void>();
    private translations:any;

    constructor(private bpeService: BPEService,
                private cookieService: CookieService,
                private dataChannelService: DataChannelService,
                private searchContextService: SearchContextService,
                private bpDataService: BPDataService,
                private router: Router,
                private route: ActivatedRoute,
                private modalService: NgbModal,
                private userService: UserService,
                private appComponent: AppComponent,
                private catalogueService: CatalogueService,
                private translate: TranslateService) {
    }

    ngOnInit(): void {
        this.appComponent.translate.get(['Slow Response Time','Suspicious Company Information','Undervalued Offer','Rejected Delivery Terms','Other','Due to','Some reasons','Collaboration finished','on','Collaboration cancelled']).takeUntil(this.ngUnsubscribe).subscribe((res: any) => {
            this.translations = res;
        });
        this.route.params.subscribe(params => {
            this.routeProcessInstanceId = params["processInstanceId"];
            let sellerFederationId = params["delegateId"];
            if(this.routeProcessInstanceId == null || sellerFederationId == null) {
                return;
            }

            // get the CollaborationGroup associated to the process instance
            this.collaborationGroupRetrievalCallStatus.submit();
            this.bpeService.getGroupDetailsForProcessInstance(this.routeProcessInstanceId,sellerFederationId).then(collaborationGroup => {
                // find the process instance group containing the process instance
                for(let pig of collaborationGroup.associatedProcessInstanceGroups) {
                    for(let pid of pig.processInstanceIDs) {
                        if(pid == this.routeProcessInstanceId) {
                            this.processInstanceGroup = pig;
                            this.collaborationGroupId = collaborationGroup.id;
                            this.init();
                        }
                    }
                }
                this.collaborationGroupRetrievalCallStatus.callback(null, true);

            }).catch(error => {
                this.collaborationGroupRetrievalCallStatus.error("Failed to retrieve associated Collaboration Group", error);
            })
        });

        // null process instance group means that the component is being navigated directly (i.e. not via the dashboard)
        if(this.processInstanceGroup != null) {
            this.init();
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private init() {
        if(this.processInstanceGroup.status == "CANCELLED"){
            this.showCancelCollaborationButton = false;
        }
        this.eventCount = this.processInstanceGroup.processInstanceIDs.length;
        this.hasHistory = this.eventCount > 1;
        this.fetchEvents();
    }

    toggleHistory(): void {
        this.historyExpanded = !this.historyExpanded;
    }

    async openBpProcessView() {
        let userRole:BpUserRole = this.titleEvent.buyer ? "buyer": "seller";

        let termsSources = [];

        let numberOfProducts = this.titleEvent.products.catalogIds.length;
        for(let i=0; i<numberOfProducts;i++){
            termsSources.push(null);
        }
        this.bpDataService.startBp(
            new BpActivityEvent(
                userRole,
                this.titleEvent.processType,
                this.processInstanceGroup.id,
                this.titleEvent,
                [this.titleEvent].concat(this.history),
                null,
                null,
                false,
                this.titleEvent.products.catalogIds,
                this.titleEvent.products.lineIds,
                this.titleEvent.processInstanceId,
                ActivityVariableParser.getPrecedingDocumentId(this.titleEvent.activityVariables),
                termsSources,
                this.titleEvent.sellerFederationId));
    }

    private fetchEvents(): void {
        this.fetchCallStatus.submit();
        const ids = this.processInstanceGroup.processInstanceIDs;
        Promise.all(ids.map(id => this.fetchThreadEvent(id))).then(events => {
            this.productPartyStatusPromise.then(([negotiationSettings, productStatus]) => {
                // set seller negotiation settings
                this.sellerNegoSettings = negotiationSettings;
                // set product status
                this.productsStatus = productStatus;
                // set product status of ThreadEventMetadatas
                this.setProductsStatus(events,this.sellerNegoSettings.company.deleted);

                let isCollaborationInProgress = this.processInstanceGroup.status == "INPROGRESS";
                // if the collaboration is not in progress, the user should not be able to cancel the collaboration
                if (!isCollaborationInProgress) {
                    this.showCancelCollaborationButton = false;
                    this.showFinishCollaborationButton = false;
                }
                // check whether there are processes which are not completed
                for (let event of events) {
                    if (event.processStatus != "Completed") {
                        this.showFinishCollaborationButton = false;
                        break;
                    }
                }
                events.sort((a, b) => moment(a.startTime).diff(moment(b.startTime)));
                events = events.reverse();
                this.completeHistory = events;
                this.history = events.slice(1, events.length);
                this.lastEvent = events[0];
                // Update History in order to remove pending orders
                this.updateHistory(this.history);

                // if the collaboration is not rated yet, set the RateCollaborationButton status
                // set the status of button to True if the process is not in progress (cancelled/finished) (buyer side only)
                if (!this.isCollaborationRated(events) && !isCollaborationInProgress && this.lastEvent.buyer) {
                    this.showRateCollaborationButton = true;
                }
                // set title event
                this.titleEvent = this.lastEvent;
                this.checkDataChannel();

                // update the former step field of events after sorting and other population
                events[0].formerStep = false;
                for (let i = 1; i < events.length; i++) {
                    events[i].formerStep = true;
                }

                // if the component has been loaded directly, navigate to the details
                if (this.routeProcessInstanceId != null) {
                    this.openBpProcessView();
                }

                this.fetchCallStatus.callback("Successfully fetched events.", true);
            })
        }).catch(error => {
            this.fetchCallStatus.error("Error while fetching thread.", error);
        });
    }

    // checks the given ThreadEventMetadatas and returns True if there are at least one ThreadEventMetadata which is rated
    private isCollaborationRated(events:ThreadEventMetadata[]){
        for(let event of events){
            if(event.isRated){
                return true;
            }
        }
        return false;
    }

    /*
        For all processes except Fulfilment,
            * for the buyer,correspondentUserId is the one who sends the response
            * for the seller, correspondentUserId is the one who sends the request
        For Fulfilment, this is vice versa.
     */
    private getCorrespondentUserId(dashboardProcessInstanceDetails:DashboardProcessInstanceDetails, userRole:string,processType:ProcessType):string[]{
        let requestDocument:any = dashboardProcessInstanceDetails.requestDocument;

        let coorespondentUserIdFederationId = null;
        if (userRole === "buyer") {
            let correspondentUserId = null;
            if(processType == "Fulfilment"){
                correspondentUserId = dashboardProcessInstanceDetails.requestCreatorUserId;
            }
            else if(dashboardProcessInstanceDetails.responseCreatorUserId){
                correspondentUserId = dashboardProcessInstanceDetails.responseCreatorUserId;
            }
            coorespondentUserIdFederationId = [correspondentUserId,requestDocument.buyerPartyFederationId];
        }
        else {
            let correspondentUserId = null;
            if(processType == "Fulfilment"){
                if(dashboardProcessInstanceDetails.responseCreatorUserId){
                    correspondentUserId = dashboardProcessInstanceDetails.responseCreatorUserId;
                }
            }
            else {
                correspondentUserId = dashboardProcessInstanceDetails.requestCreatorUserId;
            }
            coorespondentUserIdFederationId = [correspondentUserId,requestDocument.sellerPartyFederationId];
        }
        return coorespondentUserIdFederationId;
    }

    setProductsStatus(events:ThreadEventMetadata[],isCompanyDeleted:boolean){
        for(let event of events){
            let areProductsDeleted:boolean[] = [];
            for(let productStatus of this.productsStatus){
                areProductsDeleted.push(!productStatus || isCompanyDeleted);
            }
            event.areProductsDeleted = areProductsDeleted;
        }

    }

    private async fetchThreadEvent(processInstanceId: string): Promise<ThreadEventMetadata> {
        // get dashboard process instance details
        const dashboardProcessInstanceDetails:DashboardProcessInstanceDetails = await this.bpeService.getDashboardProcessInstanceDetails(processInstanceId,this.processInstanceGroup.sellerFederationId);

        const activityVariables = dashboardProcessInstanceDetails.variableInstance;
        const processType = ActivityVariableParser.getProcessType(activityVariables);
        const initialDoc: any = dashboardProcessInstanceDetails.requestDocument;
        const responseDocumentStatus: any = dashboardProcessInstanceDetails.responseDocumentStatus;
        const userRole = ActivityVariableParser.getUserRole(initialDoc.buyerPartyId,initialDoc.buyerPartyFederationId,this.processInstanceGroup.partyID,this.processInstanceGroup.federationID);
        const lastActivityStartTime = dashboardProcessInstanceDetails.lastActivityInstanceStartTime;
        const processInstanceState:any = dashboardProcessInstanceDetails.processInstanceState;

        if(this.lastEventPartnerID == null){
            if (userRole === "buyer") {
                this.lastEventPartnerID = initialDoc.sellerPartyId;
                this.lastEventPartnerFederationId = initialDoc.sellerPartyFederationId;
            }
            else {
                this.lastEventPartnerID = initialDoc.buyerPartyId;
                this.lastEventPartnerFederationId = initialDoc.buyerPartyFederationId;
            }

            this.userService.getParty(this.lastEventPartnerID,this.lastEventPartnerFederationId).then(party => {
                this.tradingPartnerName = UBLModelUtils.getPartyDisplayNameForPartyName(party.partyName);
            })
        }
        let sellerFederationId:string = initialDoc.sellerPartyFederationId;

        const isRated = await this.bpeService.ratingExists(processInstanceId, this.lastEventPartnerID,this.lastEventPartnerFederationId,sellerFederationId);

        const event: ThreadEventMetadata = new ThreadEventMetadata(
            processType,
            processType.replace(/[_]/gi, " "),
            processInstanceId,
            moment(new Date(lastActivityStartTime), 'YYYY-MM-DD HH:mm:ss.SSSZ').format("YYYY-MM-DD HH:mm:ss"),
            initialDoc.items,
            this.getCorrespondentUserId(dashboardProcessInstanceDetails,userRole,processType),
            this.getBPStatus(responseDocumentStatus),
            initialDoc.buyerPartyId,
            activityVariables,
            userRole === "buyer",
            isRated === "true",
            null, // we will fetch this info later
            this.processInstanceGroup.status,
            sellerFederationId,
            dashboardProcessInstanceDetails.cancellationReason,
            moment(new Date(dashboardProcessInstanceDetails.requestDate), 'YYYY-MM-DDTHH:mm:ss.SSSZ').format("YYYY-MM-DD HH:mm:ss"),
            dashboardProcessInstanceDetails.responseDate ? moment(new Date(dashboardProcessInstanceDetails.responseDate), 'YYYY-MM-DDTHH:mm:ss.SSSZ').format("YYYY-MM-DD HH:mm:ss") : null,
            dashboardProcessInstanceDetails.completionDate
        );

        this.fillStatus(event, processInstanceState, processType, responseDocumentStatus, userRole === "buyer");

        if(!this.productPartyStatusPromise){
            // when all threads are fetched, we'll use the responses of this promise to set product status i.e. areProductsDeleted in ThreadEventMetadatas
            this.productPartyStatusPromise = Promise.all([
                this.userService.getCompanyNegotiationSettingsForParty(initialDoc.sellerPartyId, initialDoc.sellerPartyFederationId),
                this.catalogueService.areProductsValid(initialDoc.items.catalogIds,initialDoc.items.lineIds,sellerFederationId)
            ]);
        }
        return event;
    }

    getCollaborationCancelledStatus(reason:string,date:string):string{
        let status = this.translations["Collaboration cancelled"];
        if(reason){
            if(reason == "Other"){
                reason = "Some reasons";
            }
            status += " "+ this.translations["Due to"] + " "+ this.translations[reason];
        }
        if(date){
            status += " " + this.translations["on"] + " " + date;
        }
        return status;
    }

    getCollaborationFinishedStatus(date:string):string{
        if(date){
            return this.translations["Collaboration finished"] + " " + this.translations["on"] + " " + date;
        }
        return this.translations["Collaboration finished"];
    }

    // getters for span titles
    getProductTitle(index:number):string {
        if(!this.titleEvent.areProductsDeleted || this.titleEvent.areProductsDeleted[index] ){
            return this.translate.instant('The product has been deleted.');
        }
        return '';
    }

    getTradingPartnerTitle():string{
        if(this.sellerNegoSettings.company.deleted){
            return this.translate.instant('The company selling this product is not available on the platform anymore');
        }
        return '';
    }

    navigateToSearchDetails(products:any,index:number) {
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: products.catalogIds[index],
                    id: products.lineIds[index]
                }
            });
    }

    navigateToCompanyDetails() {
        this.router.navigate(['/user-mgmt/company-details'], {
            queryParams: {
                id: this.lastEventPartnerID,
                delegateId: this.lastEventPartnerFederationId
            }
        });
    }

    private updateHistory(events: ThreadEventMetadata[]) {
      for (let event of events) {
        if (event.processType == "Order" && event.status != "DONE" && event.processStatus == "Completed") {
          event.status = "DONE";
          if (event.statusText != "Order declined")
            event.statusText = "Order approved";
          event.actionText = "See Order";
        }
      }
    }

    private fillStatus(event: ThreadEventMetadata, processState: "EXTERNALLY_TERMINATED" | "COMPLETED" | "ACTIVE",
                       processType: ProcessType, response: any, buyer: boolean): void {

        event.status = this.getStatus(processState, processType, response, buyer);

        // messages if there is no response from the responder party
        if (response == null) {
            // messages for the buyer
            if (buyer) {
                switch(processType) {
                    case "Fulfilment":
                        event.statusText = "Action Required!";
                        if(event.status == 'CANCELLED'){
                            event.actionText = 'View Request';
                        }
                        else{
                            event.actionText = "Send Receipt Advice";
                        }
                        break;
                    case "Order":
                        event.statusText = "Waiting for Order Response";
                        event.actionText = "View Request";
                        break;
                    case "Negotiation":
                        event.statusText = "Waiting for Quotation";
                        event.actionText = "View Request";
                        break;
                    case "Ppap":
                        event.statusText = "Waiting for Ppap Response";
                        event.actionText = "View Request";
                        break;
                    case "Transport_Execution_Plan":
                        event.statusText = "Waiting for Transport Execution Plan";
                        event.actionText = "View Request";
                        break;
                    case "Item_Information_Request":
                        event.statusText = 'Waiting for Information Response';
                        event.actionText = "View Request";
                }
            } else {
                // messages for the seller
                switch(processType) {
                    case "Fulfilment":
                        event.statusText = "Waiting for Receipt Advice";
                        event.actionText = "View Request";
                        break;
                    case "Order":
                        event.statusText = "Action Required!";
                        if(event.status == 'CANCELLED'){
                            event.actionText = 'View Request';
                        }
                        else{
                            event.actionText = "Send Order Response";
                        }
                        break;
                    case "Negotiation":
                        event.statusText = "Action Required!";
                        if(event.status == 'CANCELLED'){
                            event.actionText = 'View Request';
                        }
                        else{
                            event.actionText = "Send Quotation";
                        }
                        break;
                    case "Ppap":
                        event.statusText = "Action Required!";
                        if(event.status == 'CANCELLED'){
                            event.actionText = 'View Request';
                        }
                        else{
                            event.actionText = "Send Ppap Response";
                        }
                        break;
                    case "Transport_Execution_Plan":
                        event.statusText = "Action Required!";
                        if(event.status == 'CANCELLED'){
                            event.actionText = 'View Request';
                        }
                        else{
                            event.actionText = 'Send Transport Execution Plan';
                        }
                        break;
                    case "Item_Information_Request":
                        event.statusText = "Action Required!";
                        if(event.status == 'CANCELLED'){
                            event.actionText = 'View Request';
                        }
                        else{
                            event.actionText = 'Send Information Response';
                        }
                }
            }
            // messages if the responder party responded already
        } else {
            switch(processType) {
                case "Order":
                    if (response.documentStatus == "true") {
                        event.statusText = "Order approved";
                    } else {
                        event.statusText = "Order declined";
                    }
                    event.actionText = "See Order";
                    break;
                case "Negotiation":
                    if (buyer) {
                        if (response.documentStatus == NEGOTIATION_RESPONSES.REJECTED) {
                            event.statusText = "Quotation rejected";
                        } else if (response.documentStatus == NEGOTIATION_RESPONSES.TERMS_UPDATED) {
                            event.statusText = "Quotation terms updated";
                        } else {
                            event.statusText = "Quotation accepted";
                        }
                    } else {
                        event.statusText = "Quotation sent";
                    }
                    event.actionText = "See Quotation";
                    break;
                case "Fulfilment":
                    if (buyer) {
                        event.statusText = "Receipt Advice sent";
                    } else {
                        event.statusText = "Receipt Advice received";
                    }
                    event.actionText = "See Receipt Advice";
                    break;
                case "Ppap":
                    if (response.documentStatus == "true") {
                        event.statusText = "Ppap approved";
                    } else {
                        event.statusText = "Ppap declined";
                    }
                    event.actionText = "See Ppap Response";
                    break;
                case "Transport_Execution_Plan":
                    if (buyer) {
                        event.statusText = "Transport Execution Plan received"
                    } else {
                        event.statusText = "Transport Execution Plan sent"
                    }
                    event.actionText = "See Transport Execution Plan"
                    break;
                case "Item_Information_Request":
                    if (buyer) {
                        event.statusText = "Information Request received"
                        event.actionText = "See Information Request"
                    } else {
                        event.statusText = "Information Response sent"
                        event.actionText = "See Information Response"
                    }
            }
        }
    }

    private getStatus(processState: "EXTERNALLY_TERMINATED" | "COMPLETED" | "ACTIVE",
                      processType: ProcessType, response: any, buyer: boolean): ThreadEventStatus {
        switch(processState) {
            case "COMPLETED":
                return "DONE";
            case "EXTERNALLY_TERMINATED":
                return "CANCELLED";
            default:
                if(response) {
                    return "WAITING";
                }
                if(buyer) {
                    return processType === "Fulfilment" ? "ACTION_REQUIRED" : "WAITING";
                }
                return processType === "Fulfilment" ? "WAITING" : "ACTION_REQUIRED";
        }
    }

    private getBPStatus(response: any): string {
        let bpStatus;
        if (response == null) {
            bpStatus = "Started";
        } else {
            bpStatus = "Completed";
        }
        return bpStatus;
    }

    checkDataChannel() {
        let channelId = this.processInstanceGroup.dataChannelId;
        let role = this.processInstanceGroup.collaborationRole;

        if(channelId){
            this.dataChannelService.getChannelConfig(channelId).then(channel => {
                if (role == "BUYER") {
                    if (channel.negotiationStepcounter % 5 == 1 || channel.negotiationStepcounter % 5 == 3)
                        this.enableDataChannelButton = true;
                    else
                        this.enableDataChannelButton = false;
                }
                else {
                    if (channel.negotiationStepcounter % 5 != 1)
                        this.enableDataChannelButton = true;
                    else
                        this.enableDataChannelButton = false;
                }
                this.showDataChannelButton = true;
                this.channelLink = `/data-channel/details/${channelId}`
            }).catch(err => {
                this.showDataChannelButton = false;
                console.error(err);
            });
        }
        else{
            this.showDataChannelButton = false;
        }
    }

    finishCollaboration(){
        if (confirm("Are you sure that you want to finish this collaboration?")) {
            this.archiveCallStatus.submit();
            this.bpeService.finishCollaboration(this.processInstanceGroup.id,this.processInstanceGroup.sellerFederationId)
                .then(() => {
                    this.archiveCallStatus.callback("Finished collaboration successfully");
                    this.threadStateUpdatedNoChange.next();
                })
                .catch(err => {
                    this.archiveCallStatus.error("Failed to finish collaboration",err);
                });
        }
    }

    cancelCollaboration(close){
        if (confirm("Are you sure that you want to cancel this collaboration?")) {
            this.archiveCallStatus.submit();
            this.bpeService.cancelCollaboration(this.processInstanceGroup.id,this.compComment,this.processInstanceGroup.sellerFederationId)
                .then(() => {
                    this.archiveCallStatus.callback("Cancelled collaboration successfully");
                    close();
                    this.threadStateUpdatedNoChange.next();
                })
                .catch(err => {
                    this.archiveCallStatus.error("Failed to cancel collaboration",err);
                });
        }
    }

    changeCommunicationRating(){
        this.ratingSeller = (this.compRating.QualityOfTheNegotiationProcess + this.compRating.ResponseTime) / 2;
        this.ratingOverall = (this.ratingSeller + this.ratingFulfillment + this.compRating.DeliveryAndPackaging) / 3;
    }

    changeFullfillmentRating(){
      this.ratingFulfillment = (this.compRating.ProductListingAccuracy + this.compRating.ConformanceToOtherAgreedTerms+ this.compRating.QualityOfTheOrderingProcess) / 3;
      this.ratingOverall = (this.ratingSeller + this.ratingFulfillment + this.compRating.DeliveryAndPackaging) / 3;
    }

    changeDeliveryRating(){
      this.ratingOverall = (this.ratingSeller + this.ratingFulfillment + this.compRating.DeliveryAndPackaging) / 3;
    }

    rateCollaborationSuccess(content) {

      if(this.sellerNegoSettings.company.processID.length !=0){
        this.compRating = {};

        if(this.sellerNegoSettings.company.processID.indexOf('Fulfilment') != -1){
            this.compRating["DeliveryAndPackaging"] = 0;
            this.deliveryPackage = true;
        }

        if(this.sellerNegoSettings.company.processID.indexOf('Ppap') != -1 || this.sellerNegoSettings.company.processID.indexOf('Item_Information_Request') != -1){
            this.compRating["ProductListingAccuracy"] = 0;
            this.prodListingAccu = true;
            this.compRating["ConformanceToOtherAgreedTerms"] = 0;
            this.conformToOtherAggre = true;
            this.ratingFulfillment = 0
        }

        if(this.sellerNegoSettings.company.processID.indexOf('Negotiation') != -1){
            this.compRating["QualityOfTheNegotiationProcess"] = 0;
            this.negotiationQuality = true;
            this.ratingSeller = 0;
            this.compRating["ResponseTime"] =0;
            this.responsetime = true;
        }

        if(this.sellerNegoSettings.company.processID.indexOf('Order') != -1 || this.sellerNegoSettings.company.processID.indexOf('Transport_Execution_Plan') != -1){
            this.compRating["QualityOfTheOrderingProcess"] = 0;
            this.orderQuality = true;
            this.ratingSeller = 0;
        }

      }else{
        this.compRating = {
            "QualityOfTheNegotiationProcess": 0,
            "QualityOfTheOrderingProcess": 0,
            "ResponseTime": 0,
            "ProductListingAccuracy": 0,
            "ConformanceToOtherAgreedTerms": 0,
            "DeliveryAndPackaging": 0
          };
          this.deliveryPackage = true;
          this.orderQuality = true;
          this.negotiationQuality = true;
          this.prodListingAccu = true;
          this.responsetime = true;
          this.conformToOtherAggre = true;

          this.ratingSeller = 0;
          this.ratingFulfillment = 0
      }

      this.ratingOverall = 0;


      this.compComment = "";
      this.modalService.open(content);
    }

    rateCollaborationCancelled(content) {
      this.compComment = "";
      this.modalService.open(content);
    }

    onSaveSuccessRating(close: any) {
        let ratings: EvidenceSupplied[] = [];
        let reviews: Comment[] = [];
        for (var key in this.compRating) {
          var evidence = new EvidenceSupplied(key,this.compRating[key]);
          ratings.push(evidence);
        }
        var comm = new Comment(this.compComment,new Code("","","","",""));
        reviews.push(comm);
        this.saveCallStatusRating.submit();
        this.bpeService
            .postRatings(this.lastEventPartnerID, this.lastEventPartnerFederationId, this.lastEvent.processInstanceId, ratings, reviews,this.lastEvent.sellerFederationId)
            .then(() => {
                this.saveCallStatusRating.callback("Rating saved", true);
                close();
                this.showRateCollaborationButton = false;
                this.fetchEvents();
            })
            .catch(error => {
                this.saveCallStatusRating.error("Error while saving rating", error);
            });
    }

    checkCompRating(): boolean {
      var filled = true;
      for (var key in this.compRating) {
        if (this.compRating[key] == 0)
          filled = false;
      }
      return !filled;
    }

    checkCompComment(): boolean {
      return this.compComment == "";
    }

	alertWait() {
	    alert('Waiting for trading partner... try again later.');
	}
}
