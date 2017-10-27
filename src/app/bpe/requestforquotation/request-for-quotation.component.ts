import {Component, Input, OnInit} from '@angular/core';
import * as myGlobals from '../../globals';
import {RequestForQuotation} from "../model/ubl/request-for-quotation";
import {Terms} from "../model/ubl/request-for-quotation-terms";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe.service";
import {ProcessVariables} from "../model/process-variables";
import {ProcessInstanceInputMessage} from "../model/process-instance-input-message";
import {UserService} from "../../user-mgmt/user.service";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
import {SupplierParty} from "../../catalogue/model/publish/supplier-party";
import {CustomerParty} from "../../catalogue/model/publish/customer-party";
import {ModelUtils} from "../model/model-utils";
import {LineReference} from "../../catalogue/model/publish/line-reference";
import {CatalogueLine} from "../../catalogue/model/publish/catalogue-line";
import {BPDataService} from "../bp-data-service";
import {Quotation} from "../model/ubl/quotation";

@Component({
    selector: 'request-for-quotation',
    templateUrl: './request-for-quotation.component.html'
})

export class RequestForQuotationComponent {

	@Input() requestForQuotation:RequestForQuotation;
}