import {Component, Input} from "@angular/core";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../../bpe.service";
import {ProcessVariables} from "../../model/process-variables";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {UserService} from "../../../user-mgmt/user.service";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {ModelUtils} from "../../model/model-utils";
import {BPDataService} from "../bp-data-service";
import {DespatchAdvice} from "../../../catalogue/model/publish/despatch-advice";
import {CallStatus} from "../../../common/call-status";
import {Router} from "@angular/router";

@Component({
    selector: 'despatch-advice',
    templateUrl: './despatch-advice.component.html'
})

export class DespatchAdviceComponent {

	@Input() despatchAdvice:DespatchAdvice;

	callStatus:CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private router:Router) {
    }

    sendDespatchAdvice(): void {
        let despatchAdvice: DespatchAdvice = JSON.parse(JSON.stringify(this.bpDataService.despatchAdvice));
        UBLModelUtils.removeHjidFieldsFromObject(despatchAdvice);

        let vars: ProcessVariables = ModelUtils.createProcessVariables("Fulfilment", despatchAdvice.despatchSupplierParty.party.id, despatchAdvice.deliveryCustomerParty.party.id, despatchAdvice, this.bpDataService);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

        this.callStatus.submit();
        this.bpeService.startBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Despatch Advice sent", true);
                this.router.navigate(['dashboard']);
            })
            .catch(error => {
                this.callStatus.error("Failed to send Despatch Advice");
            });
    }
}