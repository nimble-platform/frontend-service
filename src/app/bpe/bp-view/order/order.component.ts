import {Component, Input, OnInit} from "@angular/core";
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
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'order',
    templateUrl: './order.component.html'
})

export class OrderComponent implements OnInit {
    @Input() order:Order;
    contract: Contract;

    callStatus:CallStatus = new CallStatus();
    // check whether 'Send Order' button is clicked or not
    submitted:boolean = false;

    presentationMode:string = this.bpDataService.processMetadata == null ? 'edit':'singlevalue';
    dmsBtnClicked: boolean = false;
    // order.paymentTerms
    paymentTerms: {term: string, checked: boolean}[] = [];

    // necessary fields for A/B NET X payment term
    // A: discount percentage, B:the number of days the invoice must be paid within to receive the discount,
    // X: an invoice is due X days after being received
    discount:any = null;
    withinDays:any = null;
    dueDays:any  = null;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                private router:Router) {
    }

    ngOnInit(): void {
        // null check is for checking whether a new order is initialized
        // preceding process id check is for checking whether there is any preceding process before the order
        if(this.order.contract == null && this.bpDataService.precedingProcessId != null) {
            this.bpeService.constructContractForProcess(this.bpDataService.precedingProcessId).then(contract => {
                this.order.contract = [contract];
            });
        }

        this.setTerms();
        // check selected payment terms
        if(this.order.paymentTerms.paymentConditions){

            for(let i = 0;i<this.order.paymentTerms.paymentConditions.length;i++){
                let selectedTerm = this.order.paymentTerms.paymentConditions[i];

                if(selectedTerm.indexOf("NET") != -1){
                    // A/B NET X
                    if(selectedTerm.indexOf("/") != -1){
                        this.discount = selectedTerm.substring(0,selectedTerm.indexOf("/"));
                        this.withinDays = selectedTerm.substring(selectedTerm.indexOf("/")+1,selectedTerm.indexOf(" "));
                        this.dueDays = selectedTerm.substring(selectedTerm.indexOf("T")+2);
                        this.paymentTerms[6].checked = true;
                    }
                    // NET X
                    else{
                        this.paymentTerms[1].term = selectedTerm.substring(4);
                        this.paymentTerms[1].checked = true;
                    }
                }
                // X MFI
                else if(selectedTerm.indexOf("MFI") != -1){
                    this.paymentTerms[5].term = selectedTerm.substring(0,selectedTerm.indexOf("MFI")-1);
                    this.paymentTerms[5].checked = true;
                }
                else{
                    let term = this.paymentTerms.find(o => o.term === selectedTerm);
                    term.checked = true;
                }
            }
        }
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

        let selectedPaymentTerms: string[] = [];
        for(let i = 0; i< this.paymentTerms.length ; i=i+1)
        {
            if(this.paymentTerms[i].checked)
            {
                if(i == 1){
                    selectedPaymentTerms.push("NET " + this.paymentTerms[i].term);
                }
                else if(i == 5){
                    selectedPaymentTerms.push(this.paymentTerms[i].term + " MFI");
                }
                else if(i == 6){
                    selectedPaymentTerms.push(this.discount + "/" + this.withinDays + " NET "+ this.dueDays);
                }
                else{
                    selectedPaymentTerms.push(this.paymentTerms[i].term);
                }

            }
        }
        // set payment terms
        order.paymentTerms.paymentConditions = selectedPaymentTerms;


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

    setTerms(){
        this.paymentTerms = [
            {term:'PIA',checked:false},{term:null,checked:false},{term:'EOM',checked:false},{term:'CND',checked:false},
            {term:'CBS',checked:false},{term:null,checked:false},{term:null,checked:false},
            {term:'COD',checked:false},{term:'CWO',checked:false},{term:'CIA',checked:false}
        ];
    }

    disableCheckBox(termNumber){
        // NET X
        if(termNumber == 1){
            if(this.paymentTerms[1].term == null){
                this.paymentTerms[1].checked = false;
            }
        }
        // X MFI
        else if(termNumber == 5){
            if(this.paymentTerms[5].term == null){
                this.paymentTerms[5].checked = false;
            }
        }
        // A/B NET X
        else if(termNumber == 6){
            if(this.discount == null || this.withinDays == null || this.dueDays == null){
                this.paymentTerms[6].checked = false;
            }
        }
    }
}
