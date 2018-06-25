import {ChangeDetectorRef, Component, Input, OnInit} from "@angular/core";
import {CatalogueLine} from "../../../catalogue/model/publish/catalogue-line";
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
import {Order} from "../../../catalogue/model/publish/order";
import {Router} from "@angular/router";
import {Contract} from "../../../catalogue/model/publish/contract";
import {DataMonitoringClause} from "../../../catalogue/model/publish/data-monitoring-clause";
import {TradingTerm} from '../../../catalogue/model/publish/trading-term';
import {Party} from '../../../catalogue/model/publish/party';
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'order',
    templateUrl: './order.component.html'
})

export class OrderComponent implements OnInit {
    @Input() order:Order;

    callStatus:CallStatus = new CallStatus();
    // check whether 'Send Order' button is clicked or not
    submitted:boolean = false;

    presentationMode:string = this.bpDataService.processMetadata == null ? 'edit':'singlevalue';

    totalAmount: number = 0;
    paymentTerms: {term: string, checked: boolean}[] = [];

    // necessary fields for A/B NET X payment term
    // A: discount percentage, B:the number of days the invoice must be paid within to receive the discount,
    // X: an invoice is due X days after being received
    discount:any = null;
    withinDays:any = null;
    dueDays:any  = null;

    orderTermsAndConditions = "";
    buyerParty:Party;
    sellerParty:Party;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                private router:Router) {
    }

    updateTotalPrice(totalAmount: number, currency: string): void {
        this.order.anticipatedMonetaryTotal.payableAmount.value = totalAmount;
        this.order.anticipatedMonetaryTotal.payableAmount.currencyID = currency;
    }

    ngOnInit(): void {
        // null check is for checking whether a new order is initialized
        // preceding process id check is for checking whether there is any preceding process before the order
        if(this.order.contract == null && this.bpDataService.precedingProcessId != null) {
            this.bpeService.constructContractForProcess(this.bpDataService.precedingProcessId).then(contract => {
                this.order.contract = [contract];
            });
        }

        let sellerId:string = this.order.orderLine[0].lineItem.item.manufacturerParty.id;
        let buyerId:string = this.cookieService.get("company_id");

        this.userService.getParty(buyerId).then(buyerParty => {
            this.buyerParty = buyerParty;
            this.userService.getParty(sellerId).then(sellerParty => {
                this.sellerParty = sellerParty;
                this.generateOrderTermsAndConditionsAsText();
            })
        })

    }

    // addDataMonitoringClause(): void {
    //     if(this.order.contract == null) {
    //         this.order.contract = [new Contract()];
    //     }
    //
    //     let dmClause: DataMonitoringClause = new DataMonitoringClause();
    //     dmClause.id = UBLModelUtils.generateUUID();
    //     dmClause.type = 'DATA_MONITORING';
    //     this.order.contract[0].clause.push(dmClause);
    // }
    //
    // removeDataMonitoringClause(): void {
    //     this.order.contract[0].clause.pop();
    // }

    sendOrder() {
        this.submitted = true;
        this.callStatus.submit();
        let order = JSON.parse(JSON.stringify(this.bpDataService.order));

        // final check on the order
        order.orderLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;

        let selectedTradingTerms: TradingTerm[] = [];

        for(let tradingTerm of this.order.paymentTerms.tradingTerms){
            if(tradingTerm.id.indexOf("Values") != -1){
                let addToList = true;
                for(let value of tradingTerm.value){
                    if(value == null){
                        addToList = false;
                        break;
                    }
                }
                if(addToList){
                    selectedTradingTerms.push(tradingTerm);
                }
            }
            else{
                if(tradingTerm.value[0] == 'true'){
                    selectedTradingTerms.push(tradingTerm);
                }
            }
        }

        // set payment terms
        order.paymentTerms.tradingTerms = selectedTradingTerms;


        UBLModelUtils.removeHjidFieldsFromObject(order);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        let sellerId:string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        let buyerId:string = this.cookieService.get("company_id");
        this.userService.getParty(buyerId).then(buyerParty => {
            order.buyerCustomerParty = new CustomerParty(buyerParty);

            this.userService.getParty(sellerId).then(sellerParty => {
                order.sellerSupplierParty = new SupplierParty(sellerParty);

                let vars:ProcessVariables = ModelUtils.createProcessVariables("Order", buyerId, sellerId, order, this.bpDataService);
                let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                    .then(res => {
                            this.callStatus.callback("Order placed", true);
                            this.router.navigate(['dashboard']);

                    }).catch(error => {
                        this.submitted = false;
                        this.callStatus.error("Failed to send Order");
                    });
            });
        });
    }

    generateOrderTermsAndConditionsAsText(){
        this.bpeService.generateOrderTermsAndConditionsAsText(this.order,this.buyerParty,this.sellerParty).then(result => {
            this.orderTermsAndConditions = result;
        })
    }
}
