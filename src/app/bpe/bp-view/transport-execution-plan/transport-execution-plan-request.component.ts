import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { CookieService } from "ng2-cookies";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { CallStatus } from "../../../common/call-status";
import { TransportExecutionPlanRequest } from "../../../catalogue/model/publish/transport-execution-plan-request";
import { copy } from "../../../common/utils";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { ProcessVariables } from "../../model/process-variables";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { UserService } from "../../../user-mgmt/user.service";
import { ModelUtils } from "../../model/model-utils";

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "transport-execution-plan-request",
    templateUrl: "./transport-execution-plan-request.component.html",
    styleUrls: ["./transport-execution-plan-request.component.css"]
})
export class TransportExecutionPlanRequestComponent implements OnInit {

    request: TransportExecutionPlanRequest;

    callStatus: CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService, 
                private cookieService: CookieService,
                private userService: UserService,
                private router: Router,
                private location: Location) {
        
    }

    ngOnInit() {
        this.request = this.bpDataService.transportExecutionPlanRequest;
    }

    isLoading(): boolean {
        return false;
    }

    onBack(): void {
        this.location.back();
    }

    onSendRequest(): void {
        this.callStatus.submit();
        let transportationExecutionPlanRequest: TransportExecutionPlanRequest = copy(this.bpDataService.transportExecutionPlanRequest);

        // final check on the transportationExecutionPlanRequest
        transportationExecutionPlanRequest.mainTransportationService = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(transportationExecutionPlanRequest);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        const sellerId: string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        const buyerId: string = this.cookieService.get("company_id");

        this.userService.getParty(buyerId).then(buyerParty => {
            transportationExecutionPlanRequest.transportUserParty = buyerParty;

            this.userService.getParty(sellerId).then(sellerParty => {
                transportationExecutionPlanRequest.transportServiceProviderParty = sellerParty;
                const vars: ProcessVariables = ModelUtils.createProcessVariables("Transport_Execution_Plan", buyerId, sellerId, transportationExecutionPlanRequest, this.bpDataService);
                const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                    .then(() => {
                        this.callStatus.callback("Transport Execution Plan sent", true);
                        this.router.navigate(['dashboard']);
                    })
                    .catch(error => {
                        this.callStatus.error("Failed to send Transport Execution Plan", error);
                    });
            });
        });
    }
}
