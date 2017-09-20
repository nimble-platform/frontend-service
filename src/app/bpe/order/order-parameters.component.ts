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
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'order-parameters',
    templateUrl: './order-parameters.component.html'
})

export class OrderParametersComponent implements OnInit {
    @Input() catalogueLine:CatalogueLine;
    @Input() productResponse: any;

    order:Order;

    selectedTab: string = "Product Details";
    orderExpanded = false;
    submitted = false;
    callback = false;
    error_detc = false;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    ngOnInit() {
        this.bpDataService.initOrder(this.catalogueLine);
        this.order = this.bpDataService.order;
    }

    sendOrder() {
        this.submitted = true;

        // final check on the rfq
        this.bpDataService.chooseFirstValuesOfItemProperties("Order");
        this.bpDataService.chooseAllDimensions("Order");
        UBLModelUtils.removeHjidFieldsFromObject(this.order);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        let sellerId:string = this.productResponse[myGlobals.product_vendor_id].toString();
        let buyerId:string = this.cookieService.get("company_id");

        this.userService.getParty(buyerId).then(buyerParty => {
            this.order.buyerCustomerParty = new CustomerParty(buyerParty)

            this.userService.getParty(sellerId).then(sellerParty => {
                this.order.sellerSupplierParty = new SupplierParty(sellerParty);
                let vars:ProcessVariables = ModelUtils.createProcessVariables("Order", buyerId, sellerId, this.order);
                let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                    .then(res => {
                        this.error_detc = false;
                        this.callback = true;
                    })
                    .catch(error => {
                        this.error_detc = true;
                    });
            });
        });
    }
}