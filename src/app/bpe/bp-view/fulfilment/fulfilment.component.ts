import {Component, Input, OnInit} from "@angular/core";
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
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'fulfilment',
    templateUrl: './fulfilment.component.html'
})

export class FulfilmentComponent {
    selectedTab: string = "Despatch Advice Details";

    constructor(private bpDataService:BPDataService) {
    }
}