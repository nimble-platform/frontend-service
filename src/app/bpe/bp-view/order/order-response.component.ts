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
    // check whether 'Accept Order' button or 'Reject Order' button is clicked
    submitted: boolean = false;
    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private router:Router) {
    }

    respondToOrder(acceptedIndicator: boolean) {
        this.submitted = true;
        this.bpDataService.orderResponse.acceptedIndicator = acceptedIndicator;

        let vars: ProcessVariables = ModelUtils.createProcessVariables("Order", this.bpDataService.order.buyerCustomerParty.party.id, this.bpDataService.order.sellerSupplierParty.party.id, this.bpDataService.orderResponse, this.bpDataService);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.process_id);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim).then(
            res => {
                this.callStatus.callback("Order Response placed", true);
                this.router.navigate(['dashboard']);
            }
        ).catch(error => {
                this.submitted = false;
                this.callStatus.error("Failed to send Order Response");
            }
        );
    }

    downloadContractBundle(){
        this.bpeService.downloadContractBundle(this.order.id)
            .then(result => {
                    var link = document.createElement('a');
                    link.id = 'downloadLink';
                    link.href = window.URL.createObjectURL(result.content);
                    link.download = result.fileName;

                    document.body.appendChild(link);
                    var downloadLink = document.getElementById('downloadLink');
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                },
                error => {
                });
    }
}
