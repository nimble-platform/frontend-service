import { Component, OnInit } from "@angular/core";
import { BPEService } from "../../bpe.service";
import { ProcessVariables } from "../../model/process-variables";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { ModelUtils } from "../../model/model-utils";
import { BPDataService } from "../bp-data-service";
import { DespatchAdvice } from "../../../catalogue/model/publish/despatch-advice";
import { CallStatus } from "../../../common/call-status";
import { Router } from "@angular/router";
import { copy } from "../../../common/utils";
import { Location } from "@angular/common";
import { ProcessInstanceGroup } from '../../model/process-instance-group';
import { ActivityVariableParser } from '../activity-variable-parser';
import { TransportExecutionPlanRequest } from '../../../catalogue/model/publish/transport-execution-plan-request';
import { RequestForQuotation } from '../../../catalogue/model/publish/request-for-quotation';
import { Quantity } from '../../../catalogue/model/publish/quantity';
import { TransportExecutionPlan } from "../../../catalogue/model/publish/transport-execution-plan";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import {DocumentService} from "../document-service";
import {CookieService} from 'ng2-cookies';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';

@Component({
    selector: 'dispatch-advice',
    templateUrl: './dispatch-advice.component.html'
})
export class DispatchAdviceComponent implements OnInit {

    dispatchAdvice: DespatchAdvice;

	callStatus: CallStatus = new CallStatus();
    initiatingDispatchAdvice: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private router: Router,
                private cookieService: CookieService,
                private documentService: DocumentService) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        if(this.bpDataService.despatchAdvice == null) {
            this.initDispatchAdvice();
        }
        else{
            this.dispatchAdvice = this.bpDataService.despatchAdvice;
        }
    }

    async initDispatchAdvice() {
        this.initiatingDispatchAdvice.submit();
        const processInstanceGroup = await this.bpeService.getProcessInstanceGroup(this.bpDataService.bpStartEvent.containerGroupId) as ProcessInstanceGroup;
        let details = [];
        for(let id of processInstanceGroup.processInstanceIDs){
            details.push(await Promise.all([
                this.bpeService.getLastActivityForProcessInstance(id),
                this.bpeService.getProcessDetailsHistory(id)]
            ));
        }
        details = details.sort(function(a,b){
            let a_comp = a[0].startTime;
            let b_comp = b[0].startTime;
            return b_comp.localeCompare(a_comp);
        });

        let tepExists = false;
        let negoExists = false;

        // values are needed to find the correct negotiation
        let catalogueDocRef = "";
        let manuItemId = "";
        // values are needed for despatch advice
        let handlingInst = null;
        let carrierName = null;
        let carrierContact = null;
        let endDate = null;
        let deliveredQuantity:Quantity = new Quantity();

        for(let processDetails of details){
            const processType = ActivityVariableParser.getProcessType(processDetails[1]);
            const initialDoc: any = await this.documentService.getInitialDocument(processDetails[1]);
            const response: any = await this.documentService.getResponseDocument(processDetails[1]);
            if(!tepExists && processType == "Transport_Execution_Plan"){
                let res = response as TransportExecutionPlan;
                if(res.documentStatusCode.name == "Accepted"){
                    tepExists = true;

                    let tep = initialDoc as TransportExecutionPlanRequest;

                    if(tep.consignment[0].consolidatedShipment[0].handlingInstructions.length > 0){
                        handlingInst = tep.consignment[0].consolidatedShipment[0].handlingInstructions[0];
                    }
                    carrierName = UBLModelUtils.getPartyDisplayName(tep.transportServiceProviderParty);
                    endDate = tep.serviceEndTimePeriod.endDate;
                    if(tep.transportServiceProviderParty.contact){
                        carrierContact = tep.transportServiceProviderParty.contact.telephone;
                    }

                    catalogueDocRef = tep.mainTransportationService.catalogueDocumentReference.id;
                    manuItemId = tep.mainTransportationService.manufacturersItemIdentification.id;
                }
            }
            if(!negoExists && processType == "Negotiation"){
                let res = response as Quotation;
                let nego = initialDoc as RequestForQuotation;
                // check whether this negotiation is correct one or not
                if(res.documentStatusCode.name == "Accepted" &&
                    nego.requestForQuotationLine[0].lineItem.item.manufacturersItemIdentification.id == manuItemId &&
                    nego.requestForQuotationLine[0].lineItem.item.catalogueDocumentReference.id == catalogueDocRef){
                    negoExists = true;

                    deliveredQuantity.value = nego.requestForQuotationLine[0].lineItem.delivery[0].shipment.totalTransportHandlingUnitQuantity.value;
                    deliveredQuantity.unitCode = nego.requestForQuotationLine[0].lineItem.delivery[0].shipment.totalTransportHandlingUnitQuantity.unitCode;
                }
            }
            if(tepExists && negoExists){
                break;
            }
        }

        this.bpDataService.initDispatchAdvice(handlingInst,carrierName,carrierContact, deliveredQuantity, endDate);

        this.dispatchAdvice = this.bpDataService.despatchAdvice;

        this.initiatingDispatchAdvice.callback("Dispatch Advice initiated", true);
    }

    /*
     * Event Handlers
     */

    onBack(): void {
        this.location.back();
    }

    onSendDispatchAdvice(): void {
        let dispatchAdvice: DespatchAdvice = copy(this.dispatchAdvice);
        UBLModelUtils.removeHjidFieldsFromObject(dispatchAdvice);

        let vars: ProcessVariables = ModelUtils.createProcessVariables(
            "Fulfilment",
            UBLModelUtils.getPartyId(dispatchAdvice.despatchSupplierParty.party),
            UBLModelUtils.getPartyId(dispatchAdvice.deliveryCustomerParty.party),
            this.cookieService.get("user_id"),
            dispatchAdvice, 
            this.bpDataService
        );
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

        this.callStatus.submit();
        this.bpeService.startBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Dispatch Advice sent", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to send Dispatch Advice", error);
            });
    }

    onUpdateDispatchAdvice():void {
        this.callStatus.submit();

        let dispatchAdvice: DespatchAdvice = copy(this.bpDataService.despatchAdvice);

        this.bpeService.updateBusinessProcess(JSON.stringify(dispatchAdvice),"DESPATCHADVICE",this.processMetadata.processId)
            .then(() => {
                this.documentService.updateCachedDocument(dispatchAdvice.id,dispatchAdvice);
                this.callStatus.callback("Dispatch Advice updated", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to update Dispatch Advice", error);
            });
    }

    /*
     * Getters & Setters
     */

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }
}
