import {Component, Input} from "@angular/core";
import {Order} from "../../../catalogue/model/publish/order";
import {OrderResponseSimple} from "../../../catalogue/model/publish/order-response-simple";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../../bpe.service";
import {ProcessVariables} from "../../model/process-variables";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {ModelUtils} from "../../model/model-utils";
import {CallStatus} from "../../../common/call-status";
import {Router} from "@angular/router";
import {SearchContextService} from "../../../simple-search/search-context.service";
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'order-response',
    templateUrl: './order-response.component.html'
})

export class OrderResponseComponent {
    @Input() order:Order;
    @Input() orderResponse:OrderResponseSimple;

    callStatus:CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private searchContextService: SearchContextService,
                private router:Router) {
    }

    respondToOrder(acceptedIndicator: boolean) {
        this.bpDataService.orderResponse.acceptedIndicator = acceptedIndicator;

        let vars: ProcessVariables = ModelUtils.createProcessVariables("Order", this.bpDataService.order.buyerCustomerParty.party.id, this.bpDataService.order.sellerSupplierParty.party.id, this.bpDataService.orderResponse, this.bpDataService);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.process_id);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim).then(
            res => {
                this.callStatus.callback("Order Response placed", true);
                this.router.navigate(['dashboard']);
            }
        ).catch(
            error => this.callStatus.error("Failed to send Order Response")
        );
    }

    initiateDespatchAdvice() {
        this.bpDataService.initDespatchAdviceWithOrder();
        this.bpDataService.setBpOptionParameters('seller', 'Fulfilment');
    }

    searchTransportServiceProvider() {
        this.searchContextService.targetPartyRole = 'Transport Service Provider';
        this.searchContextService.associatedProcessType = 'Order';
        this.searchContextService.associatedProcessMetadata = this.bpDataService.processMetadata;
        this.bpDataService.setBpOptionParameters('buyer', 'Transport_Execution_Plan');
        this.router.navigate(['simple-search'], {queryParams: {searchContext: 'orderbp'}});
    }
}
