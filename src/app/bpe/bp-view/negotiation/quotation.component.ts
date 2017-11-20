import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Quotation} from "../../../catalogue/model/publish/quotation";
import {BPDataService} from "../bp-data-service";
import {ProcessVariables} from "../../model/process-variables";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {ModelUtils} from "../../model/model-utils";
import {CallStatus} from "../../../common/call-status";
import {BPEService} from "../../bpe.service";
import {Router} from "@angular/router";

@Component({
    selector: 'quotation',
    templateUrl: './quotation.component.html'
})

export class QuotationComponent {

	@Input() quotation:Quotation;
	@Output() newNegotiationInitialized = new EventEmitter();

    callStatus:CallStatus = new CallStatus();

    constructor(private bpeService:BPEService,
                public bpDataService:BPDataService,
                private router:Router) {
    }

    respondToRFQ() {
        let vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", this.bpDataService.requestForQuotation.buyerCustomerParty.party.id, this.bpDataService.requestForQuotation.sellerSupplierParty.party.id, this.bpDataService.quotation);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.process_id);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(
                res => {
                    this.callStatus.callback("Quotation sent", true);
                    this.router.navigate(['dashboard']);
                }
            )
            .catch(
                error => this.callStatus.error("Failed to send quotation")
            );
    }

    initiateOrder() {
        this.bpDataService.initOrderWithQuotation();
        this.bpDataService.setBpOptionParameters('buyer', 'Order');
    }

    initiateNewNegotiation() {
        this.bpDataService.initRfqWithQuotation();
        this.bpDataService.setBpOptionParameters('buyer', 'Negotiation');
        this.newNegotiationInitialized.next();
    }

    initiateTransportExecutionPlan() {
        this.bpDataService.initTransportExecutionPlanRequestWithQuotation();
        this.bpDataService.setBpOptionParameters('buyer', 'Transport_Execution_Plan');
    }
}