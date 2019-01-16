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
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { TransportExecutionPlan } from "../../../catalogue/model/publish/transport-execution-plan";
import { BpUserRole } from "../../model/bp-user-role";
import { copy } from "../../../common/utils";
import { Order } from "../../../catalogue/model/publish/order";
import { PresentationMode } from "../../../catalogue/model/publish/presentation-mode";
import {DocumentService} from '../document-service';

@Component({
    selector: "transport-execution-plan",
    templateUrl: "./transport-execution-plan.component.html"
})
export class TransportExecutionPlanComponent implements OnInit {

    request: TransportExecutionPlanRequest;
    response: TransportExecutionPlan;
    userRole: BpUserRole;
    productOrder?: Order;
    updatingProcess: boolean;

    contractCallStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    constructor(private bpDataService: BPDataService,
                private searchContextService: SearchContextService,
                private cookieService: CookieService,
                private userService: UserService,
                private bpeService: BPEService,
                private location: Location,
                private router: Router,
                private documentService: DocumentService,
                private route: ActivatedRoute) {
        
    }

    ngOnInit() {
        if(!this.bpDataService.transportExecutionPlanRequest) {
            if(this.searchContextService.associatedProcessMetadata != null) {
                this.bpDataService.initTransportExecutionPlanRequestWithOrder().then(response => {
                    this.init();
                });
            } else {
                this.bpDataService.initTransportExecutionPlanRequest();
                this.init();
            }
        }
        else {
            this.init();
        }
    }

    init(){
        this.request = this.bpDataService.transportExecutionPlanRequest;
        this.response = this.bpDataService.transportExecutionPlan;
        this.productOrder = this.bpDataService.productOrder;
        this.userRole = this.bpDataService.userRole;
        this.updatingProcess = this.bpDataService.updatingProcess;

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
        return this.bpDataService.processMetadata && !this.bpDataService.updatingProcess && this.bpDataService.processMetadata.processStatus === "Started";
    }

    isFinished(): boolean {
        return this.bpDataService.processMetadata && this.bpDataService.processMetadata.processStatus === "Completed";
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

        // final check on the transportationExecutionPlanRequest
        transportationExecutionPlanRequest.mainTransportationService = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(transportationExecutionPlanRequest);

        // first initialize the seller and buyer parties.
        // once they are fetched continue with starting the ordering process
        const sellerId: string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        const buyerId: string = this.cookieService.get("company_id");

        Promise.all([
            this.userService.getParty(buyerId),
            this.userService.getParty(sellerId)
        ])
        .then(([buyerParty, sellerParty]) => {
            transportationExecutionPlanRequest.transportUserParty = buyerParty;
            transportationExecutionPlanRequest.transportServiceProviderParty = sellerParty;

            const vars: ProcessVariables = ModelUtils.createProcessVariables("Transport_Execution_Plan", buyerId, sellerId,this.cookieService.get("user_id"), transportationExecutionPlanRequest, this.bpDataService);
            const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

            return this.bpeService.startBusinessProcess(piim);
        })
        .then(() => {
            this.callStatus.callback("Transport Execution Plan sent", true);
            this.router.navigate(['dashboard']);
        })
        .catch(error => {
            this.callStatus.error("Failed to send Transport Execution Plan", error);
        });
    }

    onUpdateRequest(): void {
        this.callStatus.submit();
        const transportationExecutionPlanRequest: TransportExecutionPlanRequest = copy(this.bpDataService.transportExecutionPlanRequest);

        this.bpeService.updateBusinessProcess(JSON.stringify(transportationExecutionPlanRequest),"TRANSPORTEXECUTIONPLANREQUEST",this.bpDataService.processMetadata.processId)
            .then(() => {
                this.documentService.updateCachedDocument(transportationExecutionPlanRequest.id,transportationExecutionPlanRequest);
                this.callStatus.callback("Item Information Request updated", true);
                this.router.navigate(['dashboard']);
            })
            .catch(error => {
                this.callStatus.error("Failed to update Item Information Request", error);
            });
    }

    onSendResponse(accepted: boolean) {
        this.response.documentStatusCode.name = accepted ? "Accepted" : "Rejected";

        const vars: ProcessVariables = ModelUtils.createProcessVariables("Transport_Execution_Plan", 
            this.bpDataService.transportExecutionPlan.transportUserParty.id, 
            this.bpDataService.transportExecutionPlan.transportServiceProviderParty.id,
            this.cookieService.get("user_id"),
            this.bpDataService.transportExecutionPlan, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, 
            this.bpDataService.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Transport Execution Plan sent", true);
                this.router.navigate(["dashboard"]);
            }).catch(error => {
                this.callStatus.error("Failed to send Transport Execution Plan", error);
            });
    }

    onDispatchAdvice() {
        this.bpDataService.initDispatchAdviceWithOrder();
        this.bpDataService.setBpOptionParameters("seller", "Fulfilment");

        const params = this.route.snapshot.queryParams;
        this.router.navigate(['bpe/bpe-exec'], {
            queryParams: {
                catalogueId: params.catalogueId,
                id: params.id,
                pid: params.pid
            }
        });
    }
}
