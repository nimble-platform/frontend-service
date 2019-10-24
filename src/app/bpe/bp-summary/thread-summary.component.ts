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
import {TranslateService} from '@ngx-translate/core';


/**
 * Created by suat on 12-Mar-18.
 */
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

    // History of events
    hasHistory: boolean = false;
    completeHistory: ThreadEventMetadata[]; // keeps all the event metadata included in the collaboration
    history: ThreadEventMetadata[]; // keeps all the event metadata included in the collaboration except the last one
    historyExpanded: boolean = false;

    ratingOverall = 0;
    ratingSeller = 0;
    ratingFulfillment = 0;

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

    // this is always true unless an approved order is present in this process group or the collaboration is already cancelled
    showCancelCollaborationButton = true;
    // as long as the collaboration is not finished/cancelled and all processes in the group are completed , it's true
    showFinishCollaborationButton = true;
    // this is always false unless the collaboration was cancelled or fully completed (buyer side only)
    showRateCollaborationButton = false;
    expanded: boolean = false;

    config = myGlobals.config;
    selectPreferredValue = selectPreferredValue;

    constructor(private bpeService: BPEService,
                private cookieService: CookieService,
                private dataChannelService: DataChannelService,
                private searchContextService: SearchContextService,
                private bpDataService: BPDataService,
                private router: Router,
                private route: ActivatedRoute,
                private modalService: NgbModal,
                private userService: UserService,
                private translate: TranslateService) {
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.routeProcessInstanceId = params["processInstanceId"];
            if(this.routeProcessInstanceId == null) {
                return;
            }

            // get the CollaborationGroup associated to the process instance
            this.collaborationGroupRetrievalCallStatus.submit();
            this.bpeService.getGroupDetailsForProcessInstance(this.routeProcessInstanceId).then(collaborationGroup => {
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

        let catalogueIds = [];
        let catalogueLineIds = [];
        let termsSources = [];

        for(let product of this.titleEvent.products){
            catalogueIds.push(product.catalogueDocumentReference.id);
            catalogueLineIds.push(product.manufacturersItemIdentification.id);
            termsSources.push(null);
        }
        this.bpDataService.startBp(
            new BpActivityEvent(
                userRole,
                this.titleEvent.processType,
                this.processInstanceGroup.id,
                this.titleEvent,
                [this.titleEvent].concat(this.history),
                this.titleEvent.products,
                null,
                false,
                catalogueIds,
                catalogueLineIds,
                this.titleEvent.processInstanceId,
                ActivityVariableParser.getPrecedingDocumentId(this.titleEvent.activityVariables),
                termsSources),
            true);
    }

    private fetchEvents(): void {
        this.fetchCallStatus.submit();
        const ids = this.processInstanceGroup.processInstanceIDs;
        Promise.all(ids.map(id => this.fetchThreadEvent(id))).then(events => {
            let isCollaborationInProgress = this.processInstanceGroup.status == "INPROGRESS";
            // if the collaboration is not in progress, the user should not be able to cancel the collaboration
            if(!isCollaborationInProgress){
                this.showCancelCollaborationButton = false;
                this.showFinishCollaborationButton = false;
            }
            // check whether there are processes which are not completed
            for(let event of events){
                if(event.processStatus != "Completed"){
                    this.showFinishCollaborationButton = false;
                    break;
                }
            }
            events.sort((a,b) => moment(a.startTime).diff(moment(b.startTime)));
            events = events.reverse();
            this.completeHistory = events;
            this.history = events.slice(1, events.length);
            this.lastEvent = events[0];
            // Update History in order to remove pending orders
            this.updateHistory(this.history);

            // if the collaboration is not rated yet, set the RateCollaborationButton status
            if(!this.isCollaborationRated(events) ){
                // set the status of button to True if the process is cancelled or it is not in progress (completed/finished) (buyer side only)
                if((!isCollaborationInProgress && this.lastEvent.buyer) || this.processInstanceGroup.status == "CANCELLED"){
                    this.showRateCollaborationButton = true;
                }
            }
            this.computeTitleEvent();
            this.checkDataChannel();

            // update the former step field of events after sorting and other population
            events[0].formerStep = false;
            for(let i=1; i<events.length; i++) {
                events[i].formerStep = true;
            }

            // if the component has been loaded directly, navigate to the details
            if(this.routeProcessInstanceId != null) {
                this.openBpProcessView();
            }

            this.fetchCallStatus.callback("Successfully fetched events.", true);
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
            * for the buyer,correspondent is the one who sends the response
            * for the seller, correspondent is the one who sends the request
        For Fulfilment, this is vice versa.
     */
    private getCorrespondent(dashboardProcessInstanceDetails:DashboardProcessInstanceDetails, userRole:string,processType:ProcessType):string{
        let correspondent = null;
        if (userRole === "buyer") {
            if(processType == "Fulfilment"){
                correspondent = dashboardProcessInstanceDetails.requestCreatorUser.firstName + " " + dashboardProcessInstanceDetails.requestCreatorUser.familyName;
            }
            else if(dashboardProcessInstanceDetails.responseCreatorUser){
                correspondent = dashboardProcessInstanceDetails.responseCreatorUser.firstName + " " + dashboardProcessInstanceDetails.responseCreatorUser.familyName;
            }
        }
        else {
            if(processType == "Fulfilment"){
                if(dashboardProcessInstanceDetails.responseCreatorUser){
                    correspondent = dashboardProcessInstanceDetails.responseCreatorUser.firstName + " " + dashboardProcessInstanceDetails.responseCreatorUser.familyName;
                }
            }
            else {
                correspondent = dashboardProcessInstanceDetails.requestCreatorUser.firstName + " " + dashboardProcessInstanceDetails.requestCreatorUser.familyName;
            }
        }
        return correspondent;
    }

    private async fetchThreadEvent(processInstanceId: string): Promise<ThreadEventMetadata> {
        // get dashboard process instance details
        const dashboardProcessInstanceDetails:DashboardProcessInstanceDetails = await this.bpeService.getDashboardProcessInstanceDetails(processInstanceId);

        const activityVariables = dashboardProcessInstanceDetails.variableInstance;
        const processType = ActivityVariableParser.getProcessType(activityVariables);
        const initialDoc: any = dashboardProcessInstanceDetails.requestDocument;
        const responseDocumentStatus: any = dashboardProcessInstanceDetails.responseDocumentStatus;
        const userRole = ActivityVariableParser.getUserRole(processType,initialDoc,this.processInstanceGroup.partyID);
        const lastActivity = dashboardProcessInstanceDetails.lastActivityInstance;
        const processInstance = dashboardProcessInstanceDetails.processInstance;
        const correspondent = this.getCorrespondent(dashboardProcessInstanceDetails,userRole,processType);

        // get seller's business process workflow
        // we need this information to set status and labels for Order properly
        const sellerNegotiationSettings = await this.userService.getCompanyNegotiationSettingsForParty(initialDoc.items[0].manufacturerParty.partyIdentification[0].id);
        const sellerWorkflow = sellerNegotiationSettings.company.processID;
        // check whether Fulfilment is included or not in seller's workflow
        const isFulfilmentIncludedInWorkflow = !sellerWorkflow || sellerWorkflow.length == 0 || sellerWorkflow.indexOf('Fulfilment') != -1;

        if (userRole === "buyer") {
            this.lastEventPartnerID = UBLModelUtils.getPartyId(initialDoc.items[0].manufacturerParty);
        }
        else {
            this.lastEventPartnerID = initialDoc.buyerPartyId;
        }

        const isRated = await this.bpeService.ratingExists(processInstanceId, this.lastEventPartnerID);

        const event: ThreadEventMetadata = new ThreadEventMetadata(
            processType,
            processType.replace(/[_]/gi, " "),
            processInstanceId,
            moment(new Date(lastActivity["startTime"]), 'YYYY-MM-DDTHH:mm:ss.SSSZ').format("YYYY-MM-DD HH:mm:ss"),
            ActivityVariableParser.getTradingPartnerName(initialDoc, this.cookieService.get("company_id"),processType),
            initialDoc.items,
            correspondent,
            this.getBPStatus(responseDocumentStatus),
            initialDoc,
            activityVariables,
            userRole === "buyer",
            isRated === "true",
            initialDoc.areProductsDeleted,
            this.processInstanceGroup.status == "COMPLETED"
        );

        this.fillStatus(event, processInstance["state"], processType, responseDocumentStatus, userRole === "buyer",isFulfilmentIncludedInWorkflow);

        return event;
    }

    navigateToSearchDetails() {
        const items = this.titleEvent.products;
        this.searchContextService.clearSearchContext();
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: items[0].catalogueDocumentReference.id,
                    id: items[0].manufacturersItemIdentification.id
                }
            });
    }

    navigateToCompanyDetails() {
        this.router.navigate(['/user-mgmt/company-details'], {
            queryParams: {
                id: this.lastEventPartnerID
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
                       processType: ProcessType, response: any, buyer: boolean, isFulfilmentIncludedInWorkflow:boolean): void {

        event.status = this.getStatus(processState, processType, response, buyer, isFulfilmentIncludedInWorkflow);

        // messages if there is no response from the responder party
        if (response == null) {
            // messages for the buyer
            if (buyer) {
                switch(processType) {
                    case "Fulfilment":
                        event.statusText = "Action Required!";
                        event.actionText = "Send Receipt Advice";
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
                        event.actionText = "Send Order Response";
                        break;
                    case "Negotiation":
                        event.statusText = "Action Required!";
                        event.actionText = "Send Quotation";
                        break;
                    case "Ppap":
                        event.statusText = "Action Required!";
                        event.actionText = "Send Ppap Response";
                        break;
                    case "Transport_Execution_Plan":
                        event.statusText = "Action Required!";
                        event.actionText = "Send Transport Execution Plan";
                        break;
                    case "Item_Information_Request":
                        event.statusText = "Action Required!";
                        event.actionText = 'Send Information Response';
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
                        //this.showRateCollaborationButton = true;
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
                      processType: ProcessType, response: any, buyer: boolean,isFulfilmentIncludedInWorkflow:boolean): ThreadEventStatus {
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

    private computeTitleEvent() {
        this.titleEvent = this.lastEvent;
        // if the event is a transportation service, go through the history and check the last event that is not (if any)
        if(this.areTransportationServices(this.lastEvent.products)) {
            // history ordered from new to old
            for(let i = this.history.length - 1; i >= 0; i--) {
                const event = this.history[i]
                if(!this.areTransportationServices(event.products)) {
                    // if not a transport, this is relevant, doing it in the for loop makes sure the LAST non-transport event is the relevant one.
                    this.titleEvent = event;
                }
            }
        }
    }

    private areTransportationServices(items: Item[]){
        for(let item of items){
            if(!item.transportationServiceDetails){
                return false;
            }
        }
        return true;
    }

    deleteGroup(): void {
        if (confirm("Are you sure that you want to delete this business process thread?")) {
            this.archiveCallStatus.submit();
            this.bpeService.deleteProcessInstanceGroup(this.processInstanceGroup.id)
                .then(() => {
                    this.archiveCallStatus.callback('Thread deleted permanently');
                    this.threadStateUpdated.next();
                })
                .catch(err => {
                    this.archiveCallStatus.error('Failed to delete thread permanently', err);
                });
        }
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
            this.bpeService.finishCollaboration(this.processInstanceGroup.id)
                .then(() => {
                    this.archiveCallStatus.callback("Finished collaboration successfully");
                    this.threadStateUpdatedNoChange.next();
                })
                .catch(err => {
                    this.archiveCallStatus.error("Failed to finish collaboration",err);
                });
        }
    }

    cancelCollaboration(){
        if (confirm("Are you sure that you want to cancel this collaboration?")) {
            this.archiveCallStatus.submit();
            this.bpeService.cancelCollaboration(this.processInstanceGroup.id)
                .then(() => {
                    this.archiveCallStatus.callback("Cancelled collaboration successfully");
                    this.threadStateUpdatedNoChange.next();
                })
                .catch(err => {
                    this.archiveCallStatus.error("Failed to cancel collaboration",err);
                });
        }
    }

    rateCollaboration(success,cancel) {
      if(this.processInstanceGroup.status == "CANCELLED") {
        this.rateCollaborationCancelled(cancel);
      }
      else {
        this.rateCollaborationSuccess(success);
      }
    }

    changeCommunicationRating(){
        this.ratingSeller = (this.compRating.QualityOfTheNegotiationProcess + this.compRating.QualityOfTheOrderingProcess + this.compRating.ResponseTime) / 3;
        this.ratingOverall = (this.ratingSeller + this.ratingFulfillment + this.compRating.DeliveryAndPackaging) / 3;
    }

    changeFullfillmentRating(){
      this.ratingFulfillment = (this.compRating.ProductListingAccuracy + this.compRating.ConformanceToOtherAgreedTerms) / 2;
      this.ratingOverall = (this.ratingSeller + this.ratingFulfillment + this.compRating.DeliveryAndPackaging) / 3;
    }

    changeDeliveryRating(){
      this.ratingOverall = (this.ratingSeller + this.ratingFulfillment + this.compRating.DeliveryAndPackaging) / 3;
    }

    rateCollaborationSuccess(content) {
      this.compRating = {
        "QualityOfTheNegotiationProcess": 0,
        "QualityOfTheOrderingProcess": 0,
        "ResponseTime": 0,
        "ProductListingAccuracy": 0,
        "ConformanceToOtherAgreedTerms": 0,
        "DeliveryAndPackaging": 0
      };
      this.ratingOverall = 0;
      this.ratingSeller = 0;
      this.ratingFulfillment = 0
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
            .postRatings(this.lastEventPartnerID, this.lastEvent.processInstanceId, ratings, reviews)
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

    onSaveCancelRating(close: any) {
        let ratings: EvidenceSupplied[] = [];
        let reviews: Comment[] = [];
        var comm = new Comment("",new Code(this.compComment,"","","",""));
        reviews.push(comm);
        this.saveCallStatusRating.submit();
        this.bpeService
            .postRatings(this.lastEventPartnerID, this.lastEvent.processInstanceId, ratings, reviews)
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
