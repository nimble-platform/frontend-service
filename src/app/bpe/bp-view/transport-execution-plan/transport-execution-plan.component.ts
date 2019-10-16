import { Component, OnInit } from "@angular/core";
import { CookieService } from "ng2-cookies";
import { Location } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { SearchContextService } from "../../../simple-search/search-context.service";
import { TransportExecutionPlanRequest } from "../../../catalogue/model/publish/transport-execution-plan-request";
import { BPEService } from "../../bpe.service";
import { UserService } from "../../../user-mgmt/user.service";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { TransportExecutionPlan } from "../../../catalogue/model/publish/transport-execution-plan";
import { BpUserRole } from "../../model/bp-user-role";
import {copy, selectPreferredValue} from '../../../common/utils';
import { Order } from "../../../catalogue/model/publish/order";
import { PresentationMode } from "../../../catalogue/model/publish/presentation-mode";
import {DocumentService} from '../document-service';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "transport-execution-plan",
    templateUrl: "./transport-execution-plan.component.html"
})
export class TransportExecutionPlanComponent implements OnInit {

    request: TransportExecutionPlanRequest;
    response: TransportExecutionPlan;
    userRole: BpUserRole;
    productOrder?: Order;
    updatingProcess: boolean = false;

    contractCallStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    itemName:string;

    constructor(private bpDataService: BPDataService,
                private searchContextService: SearchContextService,
                private cookieService: CookieService,
                private userService: UserService,
                private bpeService: BPEService,
                private location: Location,
                private router: Router,
                private documentService: DocumentService,
                private translate: TranslateService,
                private route: ActivatedRoute) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        if(!this.bpDataService.transportExecutionPlanRequest) {
            if(this.searchContextService.getAssociatedProcessMetadata() != null) {
                // this.bpDataService.initTransportExecutionPlanRequestWithOrder().then(response => {
                //     this.init();
                // });
                console.log("STILL NAVIGATING TO TEP REQUEST FOLLOWING SEARCH");
            } else {
                this.bpDataService.initTransportExecutionPlanRequestWithQuotation();
                this.init();
            }
        }
        else {
            this.init();
        }
    }

    init(){
        this.request = this.bpDataService.transportExecutionPlanRequest;
        this.itemName = selectPreferredValue(this.request.consignment[0].consolidatedShipment[0].goodsItem[0].item.name)
        this.response = this.bpDataService.transportExecutionPlan;
        this.productOrder = this.bpDataService.productOrder;
        this.userRole = this.bpDataService.bpActivityEvent.userRole;
        if(this.processMetadata && this.processMetadata.isBeingUpdated){
            this.updatingProcess = true;
        }

        if(this.request.transportContract == null && this.bpDataService.precedingProcessId != null) {
            this.contractCallStatus.submit();
            this.bpeService.constructContractForProcess(this.bpDataService.precedingProcessId).then(contract => {
                this.request.transportContract = contract;
                this.contractCallStatus.callback("Contract constructed", true);
            })
                .catch(error => {
                    this.contractCallStatus.error("Error while getting contract.", error);
                });
        }
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isStarted(): boolean {
        return this.processMetadata && !this.processMetadata.isBeingUpdated && this.processMetadata.processStatus === "Started";
    }

    isFinished(): boolean {
        return this.processMetadata && this.processMetadata.processStatus === "Completed";
    }

    isRequestDisabled(): boolean {
        return this.isLoading() || this.isStarted() || this.isFinished();
    }

    getRequestPresentationMode(): PresentationMode {
        return this.isFinished() ? "view" : "edit";
    }

    isResponseDisabled(): boolean {
        return this.isLoading() || this.isFinished();
    }

    onBack(): void {
        this.location.back();
    }

    onSendRequest(): void {
        this.callStatus.submit();
        const transportationExecutionPlanRequest: TransportExecutionPlanRequest = copy(this.bpDataService.transportExecutionPlanRequest);

        // first initialize the seller and buyer parties.
        // once they are fetched continue with starting the ordering process
        const sellerId: string = UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty);
        const buyerId: string = this.cookieService.get("company_id");

        Promise.all([
            this.userService.getParty(buyerId),
            this.userService.getParty(sellerId)
        ])
        .then(([buyerParty, sellerParty]) => {
            transportationExecutionPlanRequest.transportUserParty = buyerParty;
            transportationExecutionPlanRequest.transportServiceProviderParty = sellerParty;

            return this.bpeService.startProcessWithDocument(transportationExecutionPlanRequest);
        })
        .then(() => {
            this.callStatus.callback("Transport Execution Plan sent", true);
            var tab = "PURCHASES";
            if (this.bpDataService.bpActivityEvent.userRole == "seller")
              tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
        })
        .catch(error => {
            this.callStatus.error("Failed to send Transport Execution Plan", error);
        });
    }

    onUpdateRequest(): void {
        this.callStatus.submit();
        const transportationExecutionPlanRequest: TransportExecutionPlanRequest = copy(this.bpDataService.transportExecutionPlanRequest);

        this.bpeService.updateBusinessProcess(JSON.stringify(transportationExecutionPlanRequest),"TRANSPORTEXECUTIONPLANREQUEST",this.processMetadata.processInstanceId)
            .then(() => {
                this.documentService.updateCachedDocument(transportationExecutionPlanRequest.id,transportationExecutionPlanRequest);
                this.callStatus.callback("Item Information Request updated", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to update Item Information Request", error);
            });
    }

    onSendResponse(accepted: boolean) {
        this.callStatus.submit();
        this.response.documentStatusCode.name = accepted ? "Accepted" : "Rejected";

        //this.callStatus.submit();
        this.bpeService.startProcessWithDocument(this.bpDataService.transportExecutionPlan)
            .then(res => {
                this.callStatus.callback("Transport Execution Plan sent", true);
                this.router.navigate(["dashboard"]);
            }).catch(error => {
                this.callStatus.error("Failed to send Transport Execution Plan", error);
            });
    }

    onDispatchAdvice() {
        this.bpDataService.setCopyDocuments(false, false, false,false);
        this.bpDataService.proceedNextBpStep("seller", "Fulfilment");
    }
}
