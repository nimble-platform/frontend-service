import {Component, OnInit} from "@angular/core";
import {AppComponent} from "../app.component";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";
import {OrderResponseSimple} from "../bpe/model/ubl/order-response-simple";
import {Order} from "../bpe/model/ubl/order";
import {RequestForQuotationResponse} from "../bpe/model/ubl/request-for-quotation-response";
import {Router} from "@angular/router";
import {UserService} from "../user-mgmt/user.service";
import {ProcessInstanceInputMessage} from "../bpe/model/process-instance-input-message";
import {ProcessVariables} from "../bpe/model/process-variables";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {ModelUtils} from "../bpe/model/model-utils";
import {RequestForQuotation} from "../bpe/model/ubl/request-for-quotation";
import {Quotation} from "../bpe/model/ubl/quotation";
import {LineItem} from "../catalogue/model/publish/line-item";
import {DespatchAdvice} from "../catalogue/model/publish/despatch-advice";
import {Item} from "../catalogue/model/publish/item";
import {DespatchLine} from "../catalogue/model/publish/despatch-line";
import {ReceiptAdvice} from "../catalogue/model/publish/receipt-advice";

@Component({
    selector: 'nimble-dashboard',
    providers: [CookieService],
    templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit {

    fullName = "";
    buyer_history_temp: any;
    buyer_history: any;
    seller_history_temp: any;
    seller_history: any;

    constructor(private cookieService: CookieService,
                private bpeService: BPEService,
                private router: Router,
                private appComponent: AppComponent,
                private userService: UserService) {
    }

    ngOnInit() {
        if (this.cookieService.get("user_fullname"))
            this.fullName = this.cookieService.get("user_fullname");
        if (this.cookieService.get("user_id") && this.cookieService.get("company_id")) {
            this.buyer_history_temp = [];
            this.buyer_history = [];
            this.seller_history_temp = [];
            this.seller_history = [];
            this.loadOrders();
        }
        else
            this.appComponent.checkLogin("/login");
    }

    loadOrders() {
        this.bpeService.getInitiatorHistory(this.cookieService.get("company_id"))
            .then(activeTasks => {
                this.buyer_history_temp = [];
                this.buyer_history = [];
                for (let task of activeTasks) {

                    var time_offset = -(new Date().getTimezoneOffset() / 60);
                    var time_locale = new Date(new Date().setTime(new Date(task.startTime).getTime() + (time_offset * 60 * 60 * 1000))).toLocaleTimeString();
                    this.buyer_history_temp.push({
                        "task_id": task.id,
                        "task_name": task.name,
                        "task_description": task.description,
                        "process_id": task.processInstanceId,
                        "start_time": new Date(task.startTime).toLocaleDateString() + "\n" + time_locale
                    });

                    this.bpeService.getProcessDetailsHistory(task.processInstanceId)
                        .then(activityVariables => {

                            var vProductName = "", vContent = "", vNote = "", vActionStatus = "", vBPStatus = "",
                                vTask_id = "", vProcess_id = "", vStart_time = "", vSellerName = "", vProductId;
                            var vProcessType = activityVariables[0]["processDefinitionKey"];
                            let response: any = this.getResponse(activityVariables);
                            let initialDoc: any = this.getInitialDocument(activityVariables);
                            vProductId = this.getProducIdFromProcessData(initialDoc);
                            vProductName = this.getProductNameFromProcessData(initialDoc);
                            vNote = this.getNoteFromProcessData(initialDoc);
                            vSellerName = this.getResponderNameProcessData(initialDoc);
                            vProcess_id = initialDoc.processInstanceId;
                            vActionStatus = this.getActionStatus(vProcessType, response, true);
                            vBPStatus = this.getBPStatus(response);
                            vContent = initialDoc.value;

                            for (let t of this.buyer_history_temp) {
                                if (t.process_id == vProcess_id) {
                                    vTask_id = t.task_id;
                                    vStart_time = t.start_time;
                                }
                            }

                            this.buyer_history.push({
                                "processType": vProcessType,
                                "task_id": vTask_id,
                                "process_id": vProcess_id,
                                "start_time": vStart_time,
                                "sellerName": vSellerName,
                                "productId": vProductId,
                                "product_name": vProductName,
                                "note": vNote,
                                "processStatus": vBPStatus,
                                "actionStatus": vActionStatus,
                                "content": vContent,
                                "activityVariables": activityVariables
                            });

                            this.buyer_history.sort(function (a: any, b: any) {
                                var a_comp = a.start_time;
                                var b_comp = b.start_time;
                                return b_comp.localeCompare(a_comp);
                            });
                        })
                        .catch(error => {
                            console.error(error);
                        });
                }
            })
            .catch(error => {
                console.error(error);
            });

        this.bpeService.getRecipientHistory(this.cookieService.get("company_id"))
            .then(res => {
                this.seller_history_temp = [];
                this.seller_history = [];
                for (let task of res) {
                    this.seller_history_temp.push({
                        "task_id": task.id,
                        "task_name": task.name,
                        "task_description": task.description,
                        "process_id": task.processInstanceId,
                        "start_time": new Date(task.startTime).toLocaleDateString() + "\n" + new Date(task.startTime).toLocaleTimeString()
                    });

                    this.bpeService.getProcessDetailsHistory(task.processInstanceId)
                        .then(activityVariables => {

                            var vProductName = "", vContent = "", vNote = "", vActionStatus = "", vBPStatus = "",
                                vTask_id = "", vProcess_id = "", vStart_time = "", vBuyerName = "", vProductId;
                            var vProcessType = activityVariables[0]["processDefinitionKey"];
                            let response: any = this.getResponse(activityVariables);
                            let initialDoc: any = this.getInitialDocument(activityVariables);
                            vProductId = this.getProducIdFromProcessData(initialDoc);
                            vProductName = this.getProductNameFromProcessData(initialDoc);
                            vNote = this.getNoteFromProcessData(initialDoc);
                            vBuyerName = this.getInitiatorNameProcessData(initialDoc);
                            vProcess_id = initialDoc.processInstanceId;
                            vActionStatus = this.getActionStatus(vProcessType, response, false);
                            vBPStatus = this.getBPStatus(response);
                            vContent = initialDoc.value;

                            for (let t of this.seller_history_temp) {
                                if (t.process_id == vProcess_id) {
                                    vTask_id = t.task_id;
                                    vStart_time = t.start_time;
                                }
                            }

                            this.seller_history.push({
                                "processType": vProcessType,
                                "task_id": vTask_id,
                                "process_id": vProcess_id,
                                "start_time": vStart_time,
                                "buyerName": vBuyerName,
                                "productId": vProductId,
                                "product_name": vProductName,
                                "note": vNote,
                                "processStatus": vBPStatus,
                                "actionStatus": vActionStatus,
                                "content": vContent,
                                "activityVariables": activityVariables
                            });
                            this.seller_history.sort(function (a: any, b: any) {
                                var a_comp = a.start_time;
                                var b_comp = b.start_time;
                                return b_comp.localeCompare(a_comp);
                            });
                        })
                        .catch(error => {
                            console.error(error);
                        });
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    navigateToProductDetailsPage():void {
        this.router.navigate(['publish'], {queryParams: {pageRef: "catalogue"}});
    }

    respondToOrder(processId: string, order: Order, acceptedIndicator: boolean) {
        let orderResponse: OrderResponseSimple = UBLModelUtils.createOrderResponseSimple(order, acceptedIndicator);
        let vars: ProcessVariables = ModelUtils.createProcessVariables("Order", order.buyerCustomerParty.party.id, order.sellerSupplierParty.party.id, orderResponse);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, processId);

        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.loadOrders();
            })
            .catch(error => {
                this.loadOrders();
            });
    }

    respondToRFQ(processId: string, rfq: RequestForQuotation, acceptedIndicator: boolean) {
        let quotation: Quotation = UBLModelUtils.createQuotation(rfq);
        if (acceptedIndicator == false) {
            quotation.lineCountNumeric = 0;
            quotation.quotationLine = [];
        }
        let vars: ProcessVariables = ModelUtils.createProcessVariables("Order", quotation.buyerCustomerParty.party.id, quotation.sellerSupplierParty.party.id, quotation);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, processId);

        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.loadOrders();
            })
            .catch(error => {
                this.loadOrders();
            });
    }

    sendDespatchAdvice(activityVariables: any): void {
        let order: Order = activityVariables.find(v => v.name == 'order').value;
        let despatchAdvice: DespatchAdvice = UBLModelUtils.createDespatchAdvice(order);
        UBLModelUtils.removeHjidFieldsFromObject(despatchAdvice);

        let vars: ProcessVariables = ModelUtils.createProcessVariables("Fulfilment", despatchAdvice.deliveryCustomerParty.party.id, despatchAdvice.despatchSupplierParty.party.id, despatchAdvice);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

        this.bpeService.startBusinessProcess(piim)
            .then(res => {
                this.loadOrders();
            })
            .catch(error => {
                this.loadOrders();
            });
    }

    sendReceiptAdvice(processId: string, despatchAdvice: DespatchAdvice): void {
        let receiptAdvice: ReceiptAdvice = UBLModelUtils.createReceiptAdvice(despatchAdvice);
        let vars: ProcessVariables = ModelUtils.createProcessVariables("Fulfilment", receiptAdvice.deliveryCustomerParty.party.id, receiptAdvice.despatchSupplierParty.party.id, receiptAdvice);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, processId);

        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.loadOrders();
            })
            .catch(error => {
                this.loadOrders();
            });
    }

    getResponderNameProcessData(variable: any): string {
        let processType: string = variable.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = variable.value as Order;
            return order.sellerSupplierParty.party.name;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = variable.value as RequestForQuotation;
            return rfq.sellerSupplierParty.party.name;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = variable.value as DespatchAdvice;
            return despatchAdvice.despatchSupplierParty.party.name;
        }
    }

    getInitiatorNameProcessData(variable: any): string {
        let processType: string = variable.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = variable.value as Order;
            return order.buyerCustomerParty.party.name;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = variable.value as RequestForQuotation;
            return rfq.buyerCustomerParty.party.name;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = variable.value as DespatchAdvice;
            return despatchAdvice.deliveryCustomerParty.party.name;
        }
    }

    getProducIdFromProcessData(variable: any): string {
        let processType: string = variable.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = variable.value as Order;
            return order.orderLine[0].lineItem.lineReference[0].lineID;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = variable.value as RequestForQuotation;
            return rfq.requestForQuotationLine[0].lineItem.lineReference[0].lineID;

        } else if (processType == "Fulfilment") {
            // not required for fulfilment process records, for the time being
            return "";
        }
    }

    getProductNameFromProcessData(variable: any): string {
        let processType: string = variable.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = variable.value as Order;
            return order.orderLine[0].lineItem.item.name;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = variable.value as RequestForQuotation;
            return rfq.requestForQuotationLine[0].lineItem.item.name;

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = variable.value as DespatchAdvice;
            return despatchAdvice.despatchLine[0].item.name;
        }
    }

    getNoteFromProcessData(variable: any): string {
        let processType: string = variable.processDefinitionKey;
        if (processType == "Order") {
            let order: Order = variable.value as Order;
            return order.note;

        } else if (processType == "Negotiation") {
            let rfq: RequestForQuotation = variable.value as RequestForQuotation;
            return rfq.note[0];

        } else if (processType == "Fulfilment") {
            let despatchAdvice: DespatchAdvice = variable.value as DespatchAdvice;
            return despatchAdvice.note[0];
        }
    }

    getActionStatus(processType: string, response: any, buyer: boolean): string {
        let responseMessage;

        // messages if there is no response from the responder party
        if (response == null) {
            // messages for the buyer
            if (buyer) {
                if (processType == 'Fulfilment') {
                    responseMessage = "Receipt Advice should be sent";
                } else if (processType == 'Order') {
                    responseMessage = "Waiting for Order Response";
                } else if (processType == 'Negotiation')
                    responseMessage = "Waiting for Quotation";
            }

            // messages for the seller
            else {
                if (processType == 'Fulfilment') {
                    responseMessage = "Waiting for Receipt Advice";
                } else if (processType == 'Order') {
                    responseMessage = "Order Response should be sent";
                } else if (processType == 'Negotiation') {
                    responseMessage = "Quotation should be sent";
                }
            }

            // messages if the responder party responded already
        } else {
            if (processType == 'Order') {
                if (response.value.acceptedIndicator) {
                    responseMessage = "Order approved";
                } else {
                    responseMessage = "Order declined";
                }

            } else if (processType == 'Negotiation') {
                if(buyer) {
                    responseMessage = "Quotation received";
                } else {
                    responseMessage = "Quotation sent";
                }

            } else if (processType == 'Fulfilment') {
                if(buyer) {
                    responseMessage = "Receipt Advice sent"
                } else {
                    responseMessage = "Receipt Advice received"
                }
            }
        }
        return responseMessage;
    }

    getBPStatus(response: any): string {
        let bpStatus;
        if (response == null) {
            bpStatus = "Started";
        } else {
            bpStatus = "Completed";
        }
        return bpStatus;
    }

    getInitialDocument(processVariables: any[]): any {
        for (let variable of processVariables) {
            if (variable.name == "order" || variable.name == "requestForQuotation" || variable.name == "despatchAdvice") {
                return variable;
            }
        }
        return null;
    }

    getResponse(processVariables: any[]): any {
        for (let variable of processVariables) {
            if (variable.name == "orderResponse" || variable.name == "quotation" || variable.name == "receiptAdvice") {
                return variable;
            }
        }
        return null;
    }

    isJson(str: string): boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

}