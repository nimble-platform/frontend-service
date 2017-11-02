import {Component, OnInit} from "@angular/core";
import {BPDataService} from "../../bp-data-service";
import {BPEService} from "../../bpe.service";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {CookieService} from "ng2-cookies";
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
    selector: 'order-bp',
    templateUrl: './order-bp.component.html'
})

export class OrderBpComponent implements OnInit {

    selectedTab: string = "Order Details";
    callStatus:CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    ngOnInit() {
        if(this.bpDataService.order == null) {
            // initiating a new business process from scratch
            this.bpDataService.initOrder();
        }
    }

    sendOrder() {
        this.callStatus.submit();
        let order = JSON.parse(JSON.stringify(this.bpDataService.order));

        // final check on the order
        order.orderLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLine.goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(order);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        let sellerId:string = this.bpDataService.catalogueLine.goodsItem.item.manufacturerParty.id;
        let buyerId:string = this.cookieService.get("company_id");

        this.userService.getParty(buyerId).then(buyerParty => {
            order.buyerCustomerParty = new CustomerParty(buyerParty)

            this.userService.getParty(sellerId).then(sellerParty => {
                order.sellerSupplierParty = new SupplierParty(sellerParty);
                let vars:ProcessVariables = ModelUtils.createProcessVariables("Order", buyerId, sellerId, order);
                let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                    .then(res => {
                        this.callStatus.callback("Order Placed", true);
                    })
                    .catch(error => {
                        this.callStatus.error("Order Failed")
                    });
            });
        });
    }

    respondToOrder(acceptedIndicator: boolean) {
        this.bpDataService.orderResponse.acceptedIndicator = acceptedIndicator;

        let vars: ProcessVariables = ModelUtils.createProcessVariables("Order", this.bpDataService.order.buyerCustomerParty.party.id, this.bpDataService.order.sellerSupplierParty.party.id, this.bpDataService.orderResponse);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.process_id);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim).then(
            res => this.callStatus.callback("Order Response Placed", true)
        ).catch(
            error => this.callStatus.error("Order Response Failed")
        );
    }
}