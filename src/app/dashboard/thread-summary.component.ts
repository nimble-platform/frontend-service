import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {ProcessInstanceGroup} from "../bpe/model/process-instance-group";
import {Router} from "@angular/router";
import {BPDataService} from "../bpe/bp-view/bp-data-service";
import {BPEService} from "../bpe/bpe.service";
import {ActivityVariableParser} from "../bpe/bp-view/activity-variable-parser";
import * as moment from "moment";
import {Item} from "../catalogue/model/publish/item";
import {CallStatus} from "../common/call-status";
import {CookieService} from "ng2-cookies";
import {DataChannelService} from "../data-channel/data-channel.service";
import {UserService} from "../user-mgmt/user.service";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {PrecedingBPDataService} from "../bpe/bp-view/preceding-bp-data-service";

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

    lastIndex: number;
    processMetadata: any[] = [];
    expanded: boolean = false;
    aggregatedMetadataCount: number = 0;
    processMetadataAggregated: boolean = false;
    showDataChannelButton: boolean = false;

    archiveCallStatus: CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                private dataChannelService: DataChannelService,
                private precedingBPDataService: PrecedingBPDataService,
                private router: Router) {
    }

    ngOnInit(): void {
        this.lastIndex = this.processInstanceGroup.processInstanceIDs.length - 1;
        for (let i = 0; i <= this.lastIndex; i++) {
            this.processMetadata.push({});
            this.aggregateThreadData(this.processInstanceGroup.processInstanceIDs[i], i)
        }
    }

    aggregateThreadData(processInstanceId: string, targetIndex: number): void {
        this.bpeService.getProcessDetailsHistory(processInstanceId)
            .then(activityVariables => {

                let initialDoc: any = ActivityVariableParser.getInitialDocument(activityVariables);
                let response: any = ActivityVariableParser.getResponse(activityVariables);
                let vProcess_id = initialDoc.processInstanceId;

                this.bpeService.getLastActivityForProcessInstance(vProcess_id).then(lastActivity => {
                    this.bpeService.getProcessInstanceDetails(vProcess_id).then(processInstance => {

                        let vContent = initialDoc.value;
                        let vNote = ActivityVariableParser.getNoteFromProcessData(initialDoc);
                        let vStatusCode = processInstance.state;
                        let vProcessType = ActivityVariableParser.getProcessType(activityVariables);
                        let vActionStatus = this.getActionStatus(vProcessType, response, ActivityVariableParser.getUserRole(activityVariables, this.processInstanceGroup.partyID) == 'buyer' ? true : false);
                        let vBPStatus = this.getBPStatus(response);
                        let vStart_time = moment(lastActivity.startTime + "Z", 'YYYY-MM-DDTHH:mm:ssZ').format("YYYY-MM-DD HH:mm");
                        let vProduct = ActivityVariableParser.getProductFromProcessData(initialDoc);
                        let vTradingPartnerName = ActivityVariableParser.getTradingPartnerName(initialDoc, this.cookieService.get("company_id"));

                        if (vProcessType === 'Order') {
                            this.dataChannelService.isBusinessProcessAttached(processInstanceId)
                                .then(isChannelAttached => {
                                    this.showDataChannelButton = isChannelAttached;
                                });
                        }

                        this.processMetadata[targetIndex] = {
                            "processType": vProcessType,
                            "presentableProcessType": vProcessType.replace(/[_]/gi, ' '),
                            "process_id": vProcess_id,
                            "start_time": vStart_time,
                            "tradingPartner": vTradingPartnerName,
                            "product": vProduct,
                            "note": vNote,
                            "processStatus": vBPStatus,
                            "statusCode": vStatusCode,
                            "actionStatus": vActionStatus,
                            "content": vContent,
                            "activityVariables": activityVariables
                        };
                        this.aggregatedMetadataCount++;
                        this.processMetadata = [].concat(this.processMetadata);
                        if (this.aggregatedMetadataCount == this.processInstanceGroup.processInstanceIDs.length) {
                            this.processMetadataAggregated = true;
                            this.sortProcesses();
                        }
                    });
                });
            })
            .catch(error => {
                console.error(error);
            });
    }

    sortProcesses() {
      this.processMetadata.sort(function (a: any, b: any) {
        var a_comp = moment(a.start_time);
        var b_comp = moment(b.start_time);
        if (a_comp.isBefore(b_comp))
          return -1;
        else if (b_comp.isBefore(a_comp))
          return 1;
        else
          return 0;
      });
    }

    getActionStatus(processType: string, response: any, buyer: boolean): string {
        let responseMessage;

        // messages if there is no response from the responder party
        if (response == null) {
            // messages for the buyer
            if (buyer) {
                if (processType == 'Fulfilment') {
                    responseMessage = "Receipt Advice should be sent";
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
                    responseMessage = "Order Response should be sent";
                } else if (processType == 'Negotiation') {
                    responseMessage = "Quotation should be sent";
                } else if (processType == 'Transport_Execution_Plan') {
                    responseMessage = "Transport Execution Plan should be sent";
                } else if (processType == 'Item_Information_Request') {
                    responseMessage = 'Information Response should be sent';
                }
                else if (processType == 'Ppap') {
                    responseMessage = "Ppap Response should be sent"
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

    navigateToSearchDetails(item: Item) {
        this.bpDataService.previousProcess = null;
        this.router.navigate(['/simple-search/details'],
            {
                queryParams: {
                    catalogueId: item.catalogueDocumentReference.id,
                    id: item.manufacturersItemIdentification.id,
                    showOptions: true
                }
            });
    }

    openBpProcessView(processInstanceIndex: number) {
        let processMetadata: any = this.processMetadata[processInstanceIndex];
        let role = ActivityVariableParser.getUserRole(processMetadata.activityVariables, this.processInstanceGroup.partyID);
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

    openDataChannelView(): void {
        for (let process of this.processMetadata) {
            if (process['processType'] === 'Order') {
                this.dataChannelService.channelsForBusinessProcess(process['process_id'])
                    .then(channels => {
                        const channelId = channels[0].channelID;
                        this.router.navigate([`/data-channel/details/${channelId}`]);
                    })
                // ToDo: handle error
            }
        }
    }
}
