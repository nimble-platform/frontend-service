import { Component, OnInit } from "@angular/core";
import { CookieService } from "ng2-cookies";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
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

@Component({
    selector: "transport-execution-plan",
    templateUrl: "./transport-execution-plan.component.html"
})
export class TransportExecutionPlanComponent implements OnInit {

    request: TransportExecutionPlanRequest;
    response: TransportExecutionPlan;
    userRole: BpUserRole;

    contractCallStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    constructor(private bpDataService: BPDataService,
                private searchContextService: SearchContextService,
                private cookieService: CookieService,
                private userService: UserService,
                private bpeService: BPEService,
                private location: Location,
                private router: Router) {
        
    }

    ngOnInit() {
        if(!this.bpDataService.transportExecutionPlanRequest) {
            if(this.searchContextService.associatedProcessMetadata != null) {
                this.bpDataService.initTransportExecutionPlanRequestWithOrder();
            } else {
                this.bpDataService.initTransportExecutionPlanRequest();
            }
        }

        this.request = this.bpDataService.transportExecutionPlanRequest;
        this.response = this.bpDataService.transportExecutionPlan;
        this.userRole = this.bpDataService.userRole;

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

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        const sellerId: string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        const buyerId: string = this.cookieService.get("company_id");

        Promise.all([
            this.userService.getParty(buyerId),
            this.userService.getParty(sellerId)
        ])
        .then(([buyerParty, sellerParty]) => {
            transportationExecutionPlanRequest.transportUserParty = buyerParty;
            transportationExecutionPlanRequest.transportServiceProviderParty = sellerParty;

            const vars: ProcessVariables = ModelUtils.createProcessVariables("Transport_Execution_Plan", buyerId, sellerId, transportationExecutionPlanRequest, this.bpDataService);
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
        UBLModelUtils.removeHjidFieldsFromObject(transportationExecutionPlanRequest);

        this.bpeService.updateBusinessProcess(JSON.stringify(transportationExecutionPlanRequest),"TRANSPORTEXECUTIONPLANREQUEST",this.bpDataService.processMetadata.processId)
            .then(() => {
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
            this.bpDataService.transportExecutionPlan, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, 
            this.bpDataService.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Transport Execution Plan sent", true);
                this.router.navigate(['dashboard']);
            }).catch(error => {
                this.callStatus.error("Failed to send Transport Execution Plan")
            });
    }

    onDispatchAdvice() {
        // TODO
        // this.bpDataService.initDespatchAdvice();
        // this.bpDataService.setBpOptionParameters(this.userRole, 'Fulfilment',"Order");
        this.callStatus.submit();
        this.callStatus.error("Not implemented yet.");
    }
}
