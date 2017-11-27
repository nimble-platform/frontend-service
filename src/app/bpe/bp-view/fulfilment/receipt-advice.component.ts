import {Component, Input} from "@angular/core";
import {ReceiptAdvice} from "../../../catalogue/model/publish/receipt-advice";
import {CallStatus} from "../../../common/call-status";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {BPEService} from "../../bpe.service";
import {BPDataService} from "../bp-data-service";
import {Router} from "@angular/router";
import {ProcessVariables} from "../../model/process-variables";
import {ModelUtils} from "../../model/model-utils";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'receipt-advice',
    templateUrl: './receipt-advice.component.html'
})

export class ReceiptAdviceComponent {
    @Input() receiptAdvice:ReceiptAdvice;

    callStatus:CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private router:Router) {
    }

    sendReceiptAdvice(): void {
        let vars: ProcessVariables = ModelUtils.createProcessVariables("Fulfilment", this.bpDataService.receiptAdvice.deliveryCustomerParty.party.id, this.bpDataService.receiptAdvice.despatchSupplierParty.party.id, this.bpDataService.receiptAdvice);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.process_id);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim).then(
            res => {
                this.callStatus.callback("Receipt Advice sent", true);
                this.router.navigate(['dashboard']);
            }
        ).catch(
            error => this.callStatus.error("Failed to send Receipt Advice")
        );
    }
}
