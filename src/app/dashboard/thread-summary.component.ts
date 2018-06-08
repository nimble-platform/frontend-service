import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ProcessInstanceGroup} from "../bpe/model/process-instance-group";
import {Router} from "@angular/router";
import {BPDataService} from "../bpe/bp-view/bp-data-service";
import {BPEService} from "../bpe/bpe.service";
import {ActivityVariableParser} from "../bpe/bp-view/activity-variable-parser";
import * as moment from "moment";
import {CallStatus} from "../common/call-status";
import {CookieService} from "ng2-cookies";
import { ThreadEvent } from "./model/ThreadEvent";

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
    lastEvent: ThreadEvent;

    // History of events
    hasHistory: boolean = false;
    history: ThreadEvent[];
    historyExpanded: boolean = false;

    // Utilities
    eventCount: number = 0
    archiveCallStatus: CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private cookieService: CookieService,
                private bpDataService: BPDataService,
                private router: Router) {
    }

    ngOnInit(): void {
        this.eventCount = this.processInstanceGroup.processInstanceIDs.length;
        this.hasHistory = this.eventCount > 1;
        this.fetchLastEvent();
    }

    private fetchLastEvent(): void {
        this.fetchThreadEvent(this.processInstanceGroup.processInstanceIDs[this.eventCount - 1]).then(threadEvent => {
            this.lastEvent = threadEvent;
        }).catch(error => {
            console.log("Error while fetching event.", error);
        })
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
            console.log("Error while fetching history.", error);
        })
    }

    private async fetchThreadEvent(processInstanceId: string): Promise<ThreadEvent> {
        const activityVariables = await this.bpeService.getProcessDetailsHistory(processInstanceId);
        const vProcessType = ActivityVariableParser.getProcessType(activityVariables);

        const initialDoc: any = ActivityVariableParser.getInitialDocument(activityVariables);
        const response: any = ActivityVariableParser.getResponse(activityVariables);
        const vProcess_id = initialDoc.processInstanceId;

        const [lastActivity, processInstance] = await Promise.all([
            this.bpeService.getLastActivityForProcessInstance(vProcess_id), 
            this.bpeService.getProcessInstanceDetails(vProcess_id)]
        )

        return { 
            processType: vProcessType, 
            presentableProcessType: vProcessType.replace(/[_]/gi, " "), 
            processId: vProcess_id, 
            startTime: moment(lastActivity.startTime + "Z", 'YYYY-MM-DDTHH:mm:ssZ').format("YYYY-MM-DD HH:mm"), 
            tradingPartner: ActivityVariableParser.getTradingPartnerName(initialDoc, this.cookieService.get("company_id")), 
            product: ActivityVariableParser.getProductFromProcessData(initialDoc), 
            note: ActivityVariableParser.getNoteFromProcessData(initialDoc), 
            processStatus: this.getBPStatus(response), 
            statusCode: processInstance.state, 
            actionStatus: this.getActionStatus(vProcessType, response, ActivityVariableParser.getUserRole(activityVariables,this.processInstanceGroup.partyID) == 'buyer' ? true : false), 
            content: initialDoc.value, 
            activityVariables: activityVariables 
        };
    }

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

    getActionStatus(processType: string, response: any, buyer: boolean): string {
        let responseMessage;

        // messages if there is no response from the responder party
        if (response == null) {
            // messages for the buyer
            if (buyer) {
                if (processType == 'Fulfilment') {
                    responseMessage = "Send Receipt Advice";
                } else if (processType == 'Order') {
                    responseMessage = "Waiting for Order Response";
                } else if (processType == 'Negotiation') {
                    responseMessage = "Waiting for Quotation";
                }
                else if (processType == 'Ppap') {
                    responseMessage = "Waiting for Ppap Response";
                } else if (processType == 'Transport_Execution_Plan') {
                    responseMessage = "Waiting for Transport Execution Plan";
                } else if (processType == 'Item_Information_Request') {
                    responseMessage = 'Waiting for Information Response';
                }
            }

            // messages for the seller
            else {
                if (processType == 'Fulfilment') {
                    responseMessage = "Waiting for Receipt Advice";
                } else if (processType == 'Order') {
                    responseMessage = "Send Order Response";
                } else if (processType == 'Negotiation') {
                    responseMessage = "Send Quotation";
                } else if (processType == 'Transport_Execution_Plan') {
                    responseMessage = "Send Transport Execution Plan";
                } else if (processType == 'Item_Information_Request') {
                    responseMessage = 'Send Information Response';
                }
                else if (processType == 'Ppap') {
                    responseMessage = "Send Ppap Response"
                }
            }

            // messages if the responder party responded already
        } else {
            if (processType == 'Order') {
                if (response.value.acceptedIndicator) {
                    responseMessage = "Order approved";
                } else {
                    responseMessage = "Order declined";
                }

            } else if (processType == 'Negotiation') {
                if (buyer) {
                    responseMessage = "Quotation received";
                } else {
                    responseMessage = "Quotation sent";
                }

            } else if (processType == 'Fulfilment') {
                if (buyer) {
                    responseMessage = "Receipt Advice sent"
                } else {
                    responseMessage = "Receipt Advice received"
                }
            } else if (processType == 'Ppap') {
                if (response.value.acceptedIndicator) {
                    responseMessage = "Ppap approved";
                } else {
                    responseMessage = "Ppap declined";
                }

            } else if (processType == 'Transport_Execution_Plan') {
                if (buyer) {
                    responseMessage = "Transport Execution Plan received"
                } else {
                    responseMessage = "Transport Execution Plan sent"
                }

            } else if (processType == 'Item_Information_Request') {
                if (buyer) {
                    responseMessage = "Information Request received"
                } else {
                    responseMessage = "Information Response sent"
                }
            }
        }
        return responseMessage;
    }

    getBPStatus(response: any): string {
        let bpStatus;
        if (response == null) {
            bpStatus = "Started";
        } else {
            bpStatus = "Completed";
        }
        return bpStatus;
    }

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
}