import {Component, Input, OnInit} from "@angular/core";
import {CatalogueLine} from "../../catalogue/model/publish/catalogue-line";
import {Order} from "../model/ubl/order";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../bpe.service";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
import {CookieService} from "ng2-cookies";
import * as myGlobals from '../../globals';
import {CustomerParty} from "../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../catalogue/model/publish/supplier-party";
import {ProcessVariables} from "../model/process-variables";
import {ModelUtils} from "../model/model-utils";
import {ProcessInstanceInputMessage} from "../model/process-instance-input-message";
import {UserService} from "../../user-mgmt/user.service";
import {OrderResponseSimple} from "../model/ubl/order-response-simple";
import {CallStatus} from "../../common/call-status";
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'order-response-specific-parameters',
    templateUrl: './order-response-specific-parameters.component.html'
})

export class OrderResponseSpecificParametersComponent {
    @Input() order:Order;
    @Input() orderResponse:OrderResponseSimple;
}
