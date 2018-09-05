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
    @Output() threadStateUpdated = new EventEmitter();


    titleEvent: ThreadEventMetadata;
    lastEvent: ThreadEventMetadata;

    lastEventPartnerID = null;

    // History of events
    hasHistory: boolean = false;
    history: ThreadEventMetadata[];
    historyExpanded: boolean = false;

    // Utilities
    eventCount: number = 0
    archiveCallStatus: CallStatus = new CallStatus();
    fetchCallStatus: CallStatus = new CallStatus();
    showDataChannelButton: boolean = false;
    channelLink = "";

    constructor(private bpeService: BPEService,
                private cookieService: CookieService,
                private dataChannelService: DataChannelService,
                private bpDataService: BPDataService,
                private router: Router) {
    }

    ngOnInit(): void {
        this.eventCount = this.processInstanceGroup.processInstanceIDs.length;
        this.hasHistory = this.eventCount > 1;
        this.fetchEvents();
    }

    toggleHistory(): void {
        this.historyExpanded = !this.historyExpanded;
    }

    private fetchEvents(): void {
        this.fetchCallStatus.submit();
        const ids = this.processInstanceGroup.processInstanceIDs;
        Promise.all(ids.map(id => this.fetchThreadEvent(id))).then(events => {
            events.sort((a,b) => moment(a.startTime).diff(moment(b.startTime)));
            events = events.reverse();
            this.history = events.slice(1, events.length);
            this.lastEvent = events[0];
            this.computeTitleEvent();
            this.fetchCallStatus.callback("Successfully fetched events.", true);
        }).catch(error => {
            this.fetchCallStatus.error("Error while fetching thread.", error);
        });
    }

    private async fetchThreadEvent(processInstanceId: string): Promise<ThreadEventMetadata> {
        const activityVariables = await this.bpeService.getProcessDetailsHistory(processInstanceId);
        const processType = ActivityVariableParser.getProcessType(activityVariables);
        const initialDoc: any = ActivityVariableParser.getInitialDocument(activityVariables);
        const response: any = ActivityVariableParser.getResponse(activityVariables);
        const userRole = ActivityVariableParser.getUserRole(activityVariables,this.processInstanceGroup.partyID)
        const processId = initialDoc.processInstanceId;

        const [lastActivity, processInstance] = await Promise.all([
            this.bpeService.getLastActivityForProcessInstance(processId),
            this.bpeService.getProcessInstanceDetails(processId)]
        )

        const event: ThreadEventMetadata = new ThreadEventMetadata(
            processType,
            processType.replace(/[_]/gi, " "),
            processId,
            moment(lastActivity.startTime + "Z", 'YYYY-MM-DDTHH:mm:ssZ').format("YYYY-MM-DD HH:mm"),
            ActivityVariableParser.getTradingPartnerName(initialDoc, this.cookieService.get("company_id")),
            ActivityVariableParser.getProductFromProcessData(initialDoc),
            ActivityVariableParser.getNoteFromProcessData(initialDoc),
            this.getBPStatus(response),
            initialDoc.value,
            activityVariables,
            userRole === "buyer"
        );

        this.fillStatus(event, processInstance.state, processType, response, userRole === "buyer");

        this.checkDataChannel(event);

        if (userRole === "buyer") {
          this.lastEventPartnerID = ActivityVariableParser.getProductFromProcessData(initialDoc).manufacturerParty.id;
        }
        else {
          this.lastEventPartnerID = ActivityVariableParser.getBuyerId(initialDoc);
        }

        return event;
    }

    navigateToSearchDetails() {
        const item = this.titleEvent.product;
        this.bpDataService.previousProcess = null;
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
                    if (response.value.acceptedIndicator) {
                        event.statusText = "Order approved";
                    } else {
                        event.statusText = "Order declined";
                    }
                    event.actionText = "See Order";
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
                    } else {
                        event.statusText = "Receipt Advice received";
                    }
                    event.actionText = "See Receipt Advice";
                    break;
                case "Ppap":
                    if (response.value.acceptedIndicator) {
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

    archiveGroup(): void {
        this.archiveCallStatus.submit();
        this.bpeService.archiveProcessInstanceGroup(this.processInstanceGroup.id)
            .then(() => {
                this.archiveCallStatus.callback('Thread archived successfully');
                this.threadStateUpdated.next();
            })
            .catch(err => {
                this.archiveCallStatus.error('Failed to archive thread', err);
            });
    }

    restoreGroup(): void {
        this.archiveCallStatus.submit();
        this.bpeService.restoreProcessInstanceGroup(this.processInstanceGroup.id)
            .then(() => {
                this.archiveCallStatus.callback('Thread restored successfully');
                this.threadStateUpdated.next();
            })
            .catch(err => {
                this.archiveCallStatus.error('Failed to restore thread', err);
            });
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
            });
        }
    }

}
