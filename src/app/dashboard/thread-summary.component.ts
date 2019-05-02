import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ProcessInstanceGroup } from "../bpe/model/process-instance-group";
import { Router } from "@angular/router";
import { BPDataService } from "../bpe/bp-view/bp-data-service";
import { BPEService } from "../bpe/bpe.service";
import { ActivityVariableParser } from "../bpe/bp-view/activity-variable-parser";
import * as moment from "moment";
import { CallStatus } from "../common/call-status";
import { CookieService } from "ng2-cookies";
import { DataChannelService } from "../data-channel/data-channel.service";
import { ProcessType } from "../bpe/model/process-type";
import { ThreadEventMetadata } from "../catalogue/model/publish/thread-event-metadata";
import { ThreadEventStatus } from "../catalogue/model/publish/thread-event-status";
import { SearchContextService } from "../simple-search/search-context.service";
import {DocumentService} from "../bpe/bp-view/document-service";
import { EvidenceSupplied } from "../catalogue/model/publish/evidence-supplied";
import { Comment } from "../catalogue/model/publish/comment";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Code } from "../catalogue/model/publish/code";
import {BpUserRole} from '../bpe/model/bp-user-role';
import {BpStartEvent} from '../catalogue/model/publish/bp-start-event';
import {BpURLParams} from '../catalogue/model/publish/bpURLParams';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {selectPreferredValue} from '../common/utils';
import {DashboardProcessInstanceDetails} from '../bpe/model/dashboard-process-instance-details';
import {Item} from '../catalogue/model/publish/item';

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


    titleEvent: ThreadEventMetadata;
    lastEvent: ThreadEventMetadata;

    lastEventPartnerID = null;

    // History of events
    hasHistory: boolean = false;
    history: ThreadEventMetadata[];
    historyExpanded: boolean = false;

    ratingOverall = 0;
    ratingSeller = 0;
    ratingFulfillment = 0;

    // Utilities
    eventCount: number = 0
    archiveCallStatus: CallStatus = new CallStatus();
    fetchCallStatus: CallStatus = new CallStatus();
    saveCallStatusRating: CallStatus = new CallStatus();
    showDataChannelButton: boolean = false;
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

    // this is always false unless the collaboration was cancelled or fully completed (buyer side only)
    showRateCollaborationButton = false;

    expanded: boolean = false;

    selectPreferredValue = selectPreferredValue;

    constructor(private bpeService: BPEService,
                private cookieService: CookieService,
                private dataChannelService: DataChannelService,
                private searchContextService: SearchContextService,
                private bpDataService: BPDataService,
                private router: Router,
                private modalService: NgbModal,
                private documentService: DocumentService) {
    }

    ngOnInit(): void {
        if(this.processInstanceGroup.status == "CANCELLED"){
            this.showCancelCollaborationButton = false;
            //this.showRateCollaborationButton = true;
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
        this.bpDataService.startBp(new BpStartEvent(userRole,this.titleEvent.processType,this.processInstanceGroup.id,this.collaborationGroupId,this.titleEvent),true,
            new BpURLParams(this.titleEvent.product.catalogueDocumentReference.id,this.titleEvent.product.manufacturersItemIdentification.id,this.titleEvent.processId));
    }

    private fetchEvents(): void {
        this.fetchCallStatus.submit();
        const ids = this.processInstanceGroup.processInstanceIDs;
        Promise.all(ids.map(id => this.fetchThreadEvent(id))).then(events => {
            events.sort((a,b) => moment(a.startTime).diff(moment(b.startTime)));
            events = events.reverse();
            this.history = events.slice(1, events.length);
            this.lastEvent = events[0];
            // Update History in order to remove pending orders
            this.updateHistory(this.history);
            if (!this.lastEvent.isRated) {
              if (this.lastEvent.statusText == "Receipt Advice sent" || this.lastEvent.statusText == "Transport Execution Plan received" || this.processInstanceGroup.status == "CANCELLED") {
                this.showRateCollaborationButton = true;
              }
            }
            this.computeTitleEvent();
            this.fetchCallStatus.callback("Successfully fetched events.", true);
        }).catch(error => {
            this.fetchCallStatus.error("Error while fetching thread.", error);
        });
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
        const response: any = dashboardProcessInstanceDetails.responseDocument;
        const userRole = ActivityVariableParser.getUserRole(processType,initialDoc,this.processInstanceGroup.partyID);
        const lastActivity = dashboardProcessInstanceDetails.lastActivityInstance;
        const processInstance = dashboardProcessInstanceDetails.processInstance;
        const correspondent = this.getCorrespondent(dashboardProcessInstanceDetails,userRole,processType);

        if (userRole === "buyer") {
            let item:Item = initialDoc.item;
            this.lastEventPartnerID = UBLModelUtils.getPartyId(item.manufacturerParty);
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
            initialDoc.item,
            correspondent,
            this.getBPStatus(response),
            initialDoc,
            activityVariables,
            userRole === "buyer",
            isRated === "true"
        );

        this.fillStatus(event, processInstance["state"], processType, response, userRole === "buyer");
        this.setCancelCollaborationButtonStatus(processType,response);
        this.checkDataChannel(event);

        /*
        if (userRole === "buyer") {
            this.lastEventPartnerID = ActivityVariableParser.getProductFromProcessData(initialDoc,processType).manufacturerParty.id;
        }
        else {
            this.lastEventPartnerID = ActivityVariableParser.getBuyerId(initialDoc,processType);
        }
        */

        return event;
    }

    navigateToSearchDetails() {
        const item = this.titleEvent.product;
        this.searchContextService.clearSearchContext();
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: item.catalogueDocumentReference.id,
                    id: item.manufacturersItemIdentification.id
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
                       processType: ProcessType, response: any, buyer: boolean): void {

        event.status = this.getStatus(processState, processType, response, buyer);

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
                    if (response.acceptedIndicator) {
                        if(buyer) {
                            event.statusText = "Waiting for Dispatch Advice";
                            event.actionText = "See Order";
                        } else {
                            event.statusText = "Order approved";
                            event.actionText = "Send Dispatch Advice";
                        }
                    } else {
                        event.statusText = "Order declined";
                        event.actionText = "See Order";
                    }
                    break;
                case "Negotiation":
                    if (buyer) {
                        event.statusText = "Quotation received";
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
                    if (response.acceptedIndicator) {
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
                if(processType === "Order") {
                     return buyer ? "WAITING" : "ACTION_REQUIRED";
                }
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
        if(this.lastEvent.product.transportationServiceDetails) {
            // history ordered from new to old
            for(let i = this.history.length - 1; i >= 0; i--) {
                const event = this.history[i]
                if(!event.product.transportationServiceDetails) {
                    // if not a transport, this is relevant, doing it in the for loop makes sure the LAST non-transport event is the relevant one.
                    this.titleEvent = event;
                }
            }
        }
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

    checkDataChannel(event:ThreadEventMetadata) {
        if(event.processType === 'Order') {
            this.dataChannelService.channelsForBusinessProcess(event.processId)
                .then(channels => {
                    if (channels.length > 0) {
                        this.showDataChannelButton = true;
                        const channelId = channels[0].channelID;
                        this.channelLink = `/data-channel/details/${channelId}`
                    }
                })
                .catch(err => {
                    this.showDataChannelButton = false;
                });
        }
    }

    cancelCollaboration(){
        if (confirm("Are you sure that you want to cancel this collaboration?")) {
            this.archiveCallStatus.submit();
            this.bpeService.cancelCollaboration(this.processInstanceGroup.id)
                .then(() => {
                    this.archiveCallStatus.callback("Cancelled collaboration successfully");
                    this.threadStateUpdated.next();
                })
                .catch(err => {
                    this.archiveCallStatus.error("Failed to cancel collaboration",err);
                });
        }
    }

    setCancelCollaborationButtonStatus(processType: ProcessType, response: any){
        switch(processType) {
            case "Order":
                if (response && response.acceptedIndicator) {
                    // since the order is approved, do not show the button
                    this.showCancelCollaborationButton = false;
                }
                break;
            case "Transport_Execution_Plan":
                if (response && response.acceptedIndicator == "Accepted") {
                    this.showCancelCollaborationButton = false;
                }
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
            .postRatings(this.lastEventPartnerID, this.lastEvent.processId, ratings, reviews)
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
            .postRatings(this.lastEventPartnerID, this.lastEvent.processId, ratings, reviews)
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

}
