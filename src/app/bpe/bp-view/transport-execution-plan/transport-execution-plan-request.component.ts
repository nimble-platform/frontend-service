import {Component, Input, OnInit} from "@angular/core";
import {CatalogueLine} from "../../../catalogue/model/publish/catalogue-line";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../../bpe.service";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {CookieService} from "ng2-cookies";
import * as myGlobals from '../../../globals';
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {ProcessVariables} from "../../model/process-variables";
import {ModelUtils} from "../../model/model-utils";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {UserService} from "../../../user-mgmt/user.service";
import {CallStatus} from "../../../common/call-status";
import {Order} from "../../../catalogue/model/publish/order";
import {Router} from "@angular/router";
import {TransportExecutionPlanRequest} from "../../../catalogue/model/publish/transport-execution-plan-request";
import {PrecedingBPDataService} from "../preceding-bp-data-service";
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'transport-execution-plan-request',
    templateUrl: './transport-execution-plan-request.component.html'
})

export class TransportExecutionPlanRequestComponent implements OnInit {
    @Input() transportExecutionPlanRequest:TransportExecutionPlanRequest;

    callStatus:CallStatus = new CallStatus();
    // check whether 'Send Plan Terms' button is clicked
    submitted:boolean = false;
    // used to get correct format for start and end dates
    startDate:any;
    endDate:any;
    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private precedingBPDataService: PrecedingBPDataService,
                private cookieService: CookieService,
                private router:Router) {
    }

    ngOnInit(): void {
        // TODO instead of checking the transport contract whether it is null or not,
        // pass a query parameter for indicating initiation of a new process
        if(this.transportExecutionPlanRequest.transportContract == null && this.bpDataService.precedingProcessId != null) {
            this.bpeService.constructContractForProcess(this.bpDataService.precedingProcessId).then(contract => {
                this.transportExecutionPlanRequest.transportContract = contract;
            });
        }
    }

    sendTransportExecutionPlanRequest() {
        this.submitted = true;
        this.callStatus.submit();
        let transportationExecutionPlanRequest:TransportExecutionPlanRequest = JSON.parse(JSON.stringify(this.bpDataService.transportExecutionPlanRequest));

        // final check on the transportationExecutionPlanRequest
        transportationExecutionPlanRequest.mainTransportationService = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(transportationExecutionPlanRequest);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        let sellerId:string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        let buyerId:string = this.cookieService.get("company_id");

        this.userService.getParty(buyerId).then(buyerParty => {
            transportationExecutionPlanRequest.transportUserParty = buyerParty;

            this.userService.getParty(sellerId).then(sellerParty => {
                transportationExecutionPlanRequest.transportServiceProviderParty = sellerParty;
                let vars:ProcessVariables = ModelUtils.createProcessVariables("Transport_Execution_Plan", buyerId, sellerId, transportationExecutionPlanRequest, this.bpDataService);
                let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                    .then(res => {
                        this.callStatus.callback("Transport Execution Plan sent", true);
                        this.router.navigate(['dashboard']);
                    })
                    .catch(error => {
                        this.submitted = false;
                        this.callStatus.error("Failed to send Transport Execution Plan");
                    });
            });
        });
    }



    getDate(type:string):string{
        if(type == "Start"){
            return this.startDate.year+"-"+this.startDate.month+"-"+this.startDate.day;
        }
        return this.endDate.year+"-"+this.endDate.month+"-"+this.endDate.day;
    }
}
