import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ProcessInstanceGroup} from "../bpe/model/process-instance-group";
import {Router} from "@angular/router";
import {BPDataService} from "../bpe/bp-view/bp-data-service";
import {BPEService} from "../bpe/bpe.service";
import {ActivityVariableParser} from "../bpe/bp-view/activity-variable-parser";
import * as moment from "moment";
import {CallStatus} from "../common/call-status";
import {CookieService} from "ng2-cookies";
import {DataChannelService} from "../data-channel/data-channel.service";
import { ThreadEventMetadata } from "./model/thread-event-metadata";
import { ProcessType } from "../bpe/model/process-type";
import { ThreadEventStatus } from "./model/thread-event-status";

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

    // Most recent event
    lastEvent: ThreadEventMetadata;

    // History of events
    hasHistory: boolean = false;
    history: ThreadEventMetadata[];
    historyExpanded: boolean = false;

    // Utilities
    eventCount: number = 0
    archiveCallStatus: CallStatus = new CallStatus();
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
        this.fetchLastEvent();
        this.fetchHistory();
    }

    private fetchLastEvent(): void {
        this.fetchThreadEvent(this.processInstanceGroup.processInstanceIDs[this.eventCount - 1]).then(threadEvent => {
            this.lastEvent = threadEvent;
        }).catch(error => {
        });
    }

    toggleHistory(): void {
        this.historyExpanded = !this.historyExpanded;
        if(this.historyExpanded && !this.history) {
            this.fetchHistory();
        }
    }

    private fetchHistory(): void {
        const ids = this.processInstanceGroup.processInstanceIDs.slice(0, this.eventCount - 1)

        // inline function to avoid binding fetchThreadEvent
        Promise.all(ids.map(id => this.fetchThreadEvent(id))).then(events => {
            this.history = events.reverse()
        }).catch(error => {
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

        return event;
    }

    /*
    navigateToSearchDetails() {
        const item = this.lastEvent.product
        this.bpDataService.previousProcess = null;
        this.router.navigate(['/simple-search/details'],
            {
                queryParams: {
                    catalogueId: item.catalogueDocumentReference.id,
                    id: item.manufacturersItemIdentification.id,
                    showOptions: true
                }
            }
        );
    }
    */

    navigateToSearchDetails() {
        const item = this.lastEvent.product;
        this.bpDataService.previousProcess = null;
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: item.catalogueDocumentReference.id,
                    id: item.manufacturersItemIdentification.id,
                    showOptions: true
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

    /*
    openBpProcessView(processInstanceIndex: number) {
        let processMetadata: any = this.processMetadata[processInstanceIndex];
        let role = ActivityVariableParser.getUserRole(processMetadata.activityVariables, this.processInstanceGroup.partyID);
        // TODO this should be done in the bpe/bpe-exec route itself...
        // Or at least in both places, otherwise we cannot bookmark the BP page (or have a nice development experience.......)
        this.bpDataService.setBpOptionParametersWithProcessMetadata(role, processMetadata.processType, processMetadata);
        this.bpDataService.setRelatedGroupId(this.processInstanceGroup.id);
        this.router.navigate(['bpe/bpe-exec'], {
            queryParams: {
                catalogueId: processMetadata.product.catalogueDocumentReference.id,
                id: processMetadata.product.manufacturersItemIdentification.id,
                pid: processMetadata.process_id
            }
        });
        this.initializeAddressValues(processInstanceIndex);
    }

    initializeAddressValues(processMetadataIndex: number): void {
        let processMetadata = this.processMetadata[processMetadataIndex];
        // cache the address only if the the process is related to a logistics service
        // and the current process is item information request
        if(processMetadata != 'Item_Information_Request' && processMetadata.product.transportationServiceDetails == null) {
            return;
        }

        // check preceeding processes until finding an order to find the initial customer's address
        for(let i=processMetadataIndex-1; i>=0; i--) {
            let metadata = this.processMetadata[i];
            if(metadata.processType == 'Order') {
                let userId = this.cookieService.get('user_id');
                this.userService.getSettings(userId).then(settings => {
                    this.precedingBPDataService.toAddress = JSON.parse(JSON.stringify(metadata.content.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address));
                    this.precedingBPDataService.fromAddress = JSON.parse(JSON.stringify(UBLModelUtils.mapAddress(settings.address)));
                    this.precedingBPDataService.orderMetadata = metadata;
                });
                break;
            }
        }
    }

    toggleExpanded(): void {
        this.expanded = !this.expanded;
    }
    */

    archiveGroup(): void {
        this.archiveCallStatus.submit();
        this.bpeService.archiveProcessInstanceGroup(this.processInstanceGroup.id)
            .then(() => {
                this.archiveCallStatus.callback('Thread archived successfully');
                this.threadStateUpdated.next();
            })
            .catch(err => {
                this.archiveCallStatus.error('Failed to archive thread');
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
                this.archiveCallStatus.error('Failed to restore thread');
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
                    this.archiveCallStatus.error('Failed to delete thread permanently');
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
