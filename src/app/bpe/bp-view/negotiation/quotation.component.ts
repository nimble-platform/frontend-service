import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
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

export class QuotationComponent implements OnInit {

    @Input() quotation: Quotation;
    @Input() presentationMode: string;
    @Input() parentElement: string;

    callStatus: CallStatus = new CallStatus();
    // check whether 'Send Quotation' button is clicked or not
    submitted: boolean = false;

    constructor(private bpeService: BPEService,
                public bpDataService: BPDataService,
                private router: Router) {
    }

    ngOnInit(): void {
        this.calculatePresentationMode();
    }

    respondToRFQ() {
        this.submitted = true;
        let vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", this.bpDataService.requestForQuotation.buyerCustomerParty.party.id, this.bpDataService.requestForQuotation.sellerSupplierParty.party.id, this.bpDataService.quotation, this.bpDataService);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.process_id);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(
                res => {
                    this.callStatus.callback("Quotation sent", true);
                    this.router.navigate(['dashboard']);
                }
            )
            .catch(error => {
                    this.submitted = false;
                    this.callStatus.error("Failed to send quotation")
                }
            );
    }

    calculatePresentationMode(): void {
        if (this.presentationMode == null) {
            if (this.bpDataService.processMetadata != null && this.bpDataService.processMetadata.processStatus == 'Started') {
                this.presentationMode = 'edit';
            } else {
                this.presentationMode = 'singlevalue';
            }
        }
    }
}