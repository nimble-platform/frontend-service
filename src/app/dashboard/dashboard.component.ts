import {Component, OnInit} from "@angular/core";
import {AppComponent} from "../app.component";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";
import {Router} from "@angular/router";
import {UserService} from "../user-mgmt/user.service";
import {ProcessInstanceInputMessage} from "../bpe/model/process-instance-input-message";
import {ProcessVariables} from "../bpe/model/process-variables";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {ModelUtils} from "../bpe/model/model-utils";
import {DespatchAdvice} from "../catalogue/model/publish/despatch-advice";
import {ReceiptAdvice} from "../catalogue/model/publish/receipt-advice";
import {BPDataService} from "../bpe/bp-view/bp-data-service";
import {ActivityVariableParser} from "../bpe/bp-view/activity-variable-parser";
import {Quotation} from "../catalogue/model/publish/quotation";
import {OrderResponseSimple} from "../catalogue/model/publish/order-response-simple";
import {Order} from "../catalogue/model/publish/order";
import {Item} from "../catalogue/model/publish/item";
import * as moment from 'moment';

@Component({
    selector: 'nimble-dashboard',
    providers: [CookieService],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {

    fullName = "";
	tab = "sales";
    alert1Closed = false;
    alert2Closed = false;
    buyer_history_temp: any;
    buyer_history: any;
    seller_history_temp: any;
    seller_history: any;
	active_buyer_num = 0;
	active_seller_num = 0;

    constructor(private cookieService: CookieService,
                private bpeService: BPEService,
                private bpDataService: BPDataService,
                private router: Router,
                private appComponent: AppComponent,
                private userService: UserService) {
    }

    ngOnInit() {
        if (this.cookieService.get("user_fullname"))
            this.fullName = this.cookieService.get("user_fullname");
        if (this.cookieService.get("user_id") && this.cookieService.get("company_id")) {
			if (!this.appComponent.checkRoles('sales') && this.appComponent.checkRoles('purchases'))
				this.tab = "purchases";
            this.buyer_history_temp = [];
            this.buyer_history = [];
            this.seller_history_temp = [];
            this.seller_history = [];
            this.loadOrders();
        }
        else
            this.appComponent.checkLogin("/user-mgmt/login");
    }


    loadOrders() {
		this.active_buyer_num = 0;
		this.active_seller_num = 0;
        this.bpeService.getInitiatorHistory(this.cookieService.get("company_id"))
            .then(activeTasks => {
                this.buyer_history_temp = [];
                this.buyer_history = [];
                for (let task of activeTasks) {
                    //if (task.deleteReason!="deleted") {
                    //var time_offset = -(new Date().getTimezoneOffset() / 60);
                    //var time_locale = new Date(new Date().setTime(new Date(task.startTime).getTime() + (time_offset * 60 * 60 * 1000))).toLocaleTimeString();
                    this.buyer_history_temp.push({
                        "task_id": task.id,
                        "task_name": task.name,
                        "task_description": task.description,
                        "process_id": task.processInstanceId,
                        "status_code": task.deleteReason,
						"start_time": moment(task.startTime+"Z").format("YYYY-MM-DD HH:mm"),
                        "start_time_sortable": task.startTime
                        //"start_time": new Date(task.startTime).toLocaleDateString() + " " + time_locale
                    });

                    this.bpeService.getProcessDetailsHistory(task.processInstanceId)
                        .then(activityVariables => {
                            var vContent = "", vNote = "", vStatusCode = "", vActionStatus = "", vActionRequired = false,vBPStatus = "",
                                vTask_id = "", vProcess_id = "", vStart_time = "", vSellerName = "", vProduct,vStart_time_sortable ="",
                                vBpOptionMenuItems: any;
                            var vProcessType = ActivityVariableParser.getProcessType(activityVariables);
							var vProcessTypeReadable = vProcessType.replace(/_/g,' ');
                            let response: any = ActivityVariableParser.getResponse(activityVariables);
                            let initialDoc: any = ActivityVariableParser.getInitialDocument(activityVariables);
                            vProduct = ActivityVariableParser.getProductFromProcessData(initialDoc);
                            vNote = ActivityVariableParser.getNoteFromProcessData(initialDoc);
                            vSellerName = ActivityVariableParser.getResponderNameProcessData(initialDoc);
                            vProcess_id = initialDoc.processInstanceId;
                            vActionStatus = this.getActionStatus(vProcessType, response, true)[0];
                            vBPStatus = this.getBPStatus(response);
                            vContent = initialDoc.value;
                            vBpOptionMenuItems = this.getBpOptionsMenuItems(vProcessType, response, true);

                            for (let t of this.buyer_history_temp) {
                                if (t.process_id == vProcess_id) {
                                    vTask_id = t.task_id;
                                    vStart_time = t.start_time;
                                    vStart_time_sortable = t.start_time_sortable;
                                    vStatusCode = t.status_code;
                                }
                            }
							vActionRequired = (this.getActionStatus(vProcessType, response, true)[1] && vStatusCode != "deleted" && vStatusCode != "completed");
							
                            this.buyer_history.push({
                                "processType": vProcessType,
								"processTypeReadable": vProcessTypeReadable,
                                "task_id": vTask_id,
                                "process_id": vProcess_id,
                                "start_time": vStart_time,
                                "start_time_sortable": vStart_time_sortable,
                                "sellerName": vSellerName,
                                "product": vProduct,
                                "note": vNote,
                                "processStatus": vBPStatus,
                                "statusCode": vStatusCode,
                                "actionStatus": vActionStatus,
								"actionRequired": vActionRequired,
                                "content": vContent,
                                "activityVariables": activityVariables,
                                "bpOptionMenuItems": vBpOptionMenuItems
                            });
							if (vActionRequired)
								this.active_buyer_num++;

                            this.buyer_history.sort(function (a: any, b: any) {
                                var a_comp = a.start_time_sortable;
                                var b_comp = b.start_time_sortable;
                                return b_comp.localeCompare(a_comp);
                            });
							this.buyer_history.sort(function(a: any, b: any) {
								var a_comp = a.statusCode;
								var a2_comp = a.actionRequired;
								var b_comp = b.statusCode;
								var b2_comp = b.actionRequired;
								if (a_comp == "completed")
									a_comp = 2;
								else if (a_comp == "deleted")
									a_comp = 3;
								else {
									if (a2_comp)
										a_comp = 0;
									else
										a_comp = 1;
								}
								if (b_comp == "completed")
									b_comp = 2;
								else if (b_comp == "deleted")
									b_comp = 3;
								else {
									if (b2_comp)
										b_comp = 0;
									else
										b_comp = 1;
								}
								return a_comp-b_comp;
							});
                        })
                        .catch(error => {
                            console.error(error);
                        });
                    //}
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
                    //if (task.deleteReason!="deleted") {
                    //var time_offset = -(new Date().getTimezoneOffset() / 60);
                    //var time_locale = new Date(new Date().setTime(new Date(task.startTime).getTime() + (time_offset * 60 * 60 * 1000))).toLocaleTimeString();
                    this.seller_history_temp.push({
                        "task_id": task.id,
                        "task_name": task.name,
                        "task_description": task.description,
                        "process_id": task.processInstanceId,
                        "status_code": task.deleteReason,
						"start_time": moment(task.startTime+"Z").format("YYYY-MM-DD HH:mm"),
                        "start_time_sortable": task.startTime
                        //"start_time": new Date(task.startTime).toLocaleDateString() + " " + time_locale
                    });

                    this.bpeService.getProcessDetailsHistory(task.processInstanceId)
                        .then(activityVariables => {

                            var vContent = "", vNote = "", vStatusCode= "", vActionStatus = "", vActionRequired = false, vBPStatus = "",
                                vTask_id = "", vProcess_id = "", vStart_time = "", vBuyerName = "", vProduct,vStart_time_sortable="",
                                vBpOptionMenuItems: any;
                            var vProcessType = ActivityVariableParser.getProcessType(activityVariables);
							var vProcessTypeReadable = vProcessType.replace(/_/g,' ');
                            let response: any = ActivityVariableParser.getResponse(activityVariables);
                            let initialDoc: any = ActivityVariableParser.getInitialDocument(activityVariables);
                            vProduct = ActivityVariableParser.getProductFromProcessData(initialDoc);
                            vNote = ActivityVariableParser.getNoteFromProcessData(initialDoc);
                            vBuyerName = ActivityVariableParser.getInitiatorNameProcessData(initialDoc);
                            vProcess_id = initialDoc.processInstanceId;
                            vActionStatus = this.getActionStatus(vProcessType, response, false)[0];
                            vBPStatus = this.getBPStatus(response);
                            vContent = initialDoc.value;
                            vBpOptionMenuItems = this.getBpOptionsMenuItems(vProcessType, response, false);

                            for (let t of this.seller_history_temp) {
                                if (t.process_id == vProcess_id) {
                                    vTask_id = t.task_id;
                                    vStart_time = t.start_time;
                                    vStart_time_sortable = t.start_time_sortable;
                                    vStatusCode = t.status_code;
                                }
                            }
							vActionRequired = (this.getActionStatus(vProcessType, response, false)[1] && vStatusCode != "deleted" && vStatusCode != "completed");

                            this.seller_history.push({
                                "processType": vProcessType,
								"processTypeReadable": vProcessTypeReadable,
                                "task_id": vTask_id,
                                "process_id": vProcess_id,
                                "start_time": vStart_time,
                                "start_time_sortable": vStart_time_sortable,
                                "buyerName": vBuyerName,
                                "product": vProduct,
                                "note": vNote,
                                "processStatus": vBPStatus,
                                "statusCode": vStatusCode,
                                "actionStatus": vActionStatus,
								"actionRequired": vActionRequired,
                                "content": vContent,
                                "activityVariables": activityVariables,
                                "bpOptionMenuItems": vBpOptionMenuItems
                            });
							if (vActionRequired)
								this.active_seller_num++;
							
                            this.seller_history.sort(function (a: any, b: any) {
                                var a_comp = a.start_time_sortable;
                                var b_comp = b.start_time_sortable;
                                return b_comp.localeCompare(a_comp);
                            });
							this.seller_history.sort(function(a: any, b: any) {
								var a_comp = a.statusCode;
								var a2_comp = a.actionRequired;
								var b_comp = b.statusCode;
								var b2_comp = b.actionRequired;
								if (a_comp == "completed")
									a_comp = 2;
								else if (a_comp == "deleted")
									a_comp = 3;
								else {
									if (a2_comp)
										a_comp = 0;
									else
										a_comp = 1;
								}
								if (b_comp == "completed")
									b_comp = 2;
								else if (b_comp == "deleted")
									b_comp = 3;
								else {
									if (b2_comp)
										b_comp = 0;
									else
										b_comp = 1;
								}
								return a_comp-b_comp;
							});
                        })
                        .catch(error => {
                            console.error(error);
                        });
                    //}
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    openBpProcessView(role: string, targetProcess:string, processMetadata: any) {
        if(targetProcess == null) {
            targetProcess = ActivityVariableParser.getProcessType(processMetadata.activityVariables);
        }
        this.bpDataService.setBpOptionParametersWithProcessMetadata(role, targetProcess, processMetadata);
        this.router.navigate(['bpe/bpe-exec'], {
            queryParams: {
                catalogueId: processMetadata.product.catalogueDocumentReference.id,
                id: processMetadata.product.manufacturersItemIdentification.id,
                pid: processMetadata.process_id
            }
        });

    }
	
	cancelBP(processID: string) {
		if (confirm("Are you sure that you want to cancel this process?")){
			this.bpeService.cancelBusinessProcess(processID)
				.then(res => {
					this.loadOrders();
				})
				.catch(error => {
					console.error(error);
				});
		}
	}

    navigateToSearchDetails(item:Item) {
        this.router.navigate(['/simple-search/details'],
            { queryParams: {
                catalogueId: item.catalogueDocumentReference.id,
                id: item.manufacturersItemIdentification.id,
                showOptions: true
            }});
    }

    getActionStatus(processType: string, response: any, buyer: boolean): [string,boolean] {
        let responseMessage;
		var actionRequired = false;

        // messages if there is no response from the responder party
        if (response == null) {
            // messages for the buyer
            if (buyer) {
                if (processType == 'Fulfilment') {
                    responseMessage = "Receipt Advice should be sent";
					actionRequired = true;
                } else if (processType == 'Order') {
                    responseMessage = "Waiting for Order Response";
                } else if (processType == 'Negotiation') {
                    responseMessage = "Waiting for Quotation";
                }
                  else if (processType == 'Ppap') {
                      responseMessage = "Waiting for Ppap Response";
                } else if (processType == 'Transport_Execution_Plan') {
                    responseMessage = "Waiting for Transport Execution Plan";
                } else if (processType == 'Item_Information_Request') {
                    responseMessage = 'Waiting for Information Response';
                }
            }

            // messages for the seller
            else {
                if (processType == 'Fulfilment') {
                    responseMessage = "Waiting for Receipt Advice";
                } else if (processType == 'Order') {
                    responseMessage = "Order Response should be sent";
					actionRequired = true;
                } else if (processType == 'Negotiation') {
                    responseMessage = "Quotation should be sent";
					actionRequired = true;
                } else if (processType == 'Transport_Execution_Plan') {
                    responseMessage = "Transport Execution Plan should be sent";
					actionRequired = true;
                } else if (processType == 'Item_Information_Request') {
                    responseMessage = 'Information Response should be sent';
					actionRequired = true;
                }
                  else if(processType == 'Ppap'){
                    responseMessage = "Ppap Response should be sent";
					actionRequired = true;
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
                if (buyer) {
                    responseMessage = "Quotation received";
                } else {
                    responseMessage = "Quotation sent";
                }

            } else if (processType == 'Fulfilment') {
                if (buyer) {
                    responseMessage = "Receipt Advice sent"
                } else {
                    responseMessage = "Receipt Advice received"
                }
            } else if(processType == 'Ppap'){
                if(response.value.acceptedIndicator){
                    responseMessage = "Ppap approved";
                } else {
                    responseMessage = "Ppap declined";
                }

            } else if (processType == 'Transport_Execution_Plan') {
                if (buyer) {
                    responseMessage = "Transport Execution Plan received"
                } else {
                    responseMessage = "Transport Execution Plan sent"
                }

            } else if (processType == 'Item_Information_Request') {
                if (buyer) {
                    responseMessage = "Information Request received"
                } else {
                    responseMessage = "Information Response sent"
                }
            }
        }
        return [responseMessage,actionRequired];
    }

    getBpOptionsMenuItems(processType: string, response: any, buyer: boolean): any {
        let bpOptionMenuItems: Array<any> = [{itemLabel: 'Business History'}];
        // messages if there is no response from the responder party
        /*if (response == null) {
            // messages for the buyer
            if (buyer) {
                if (processType == 'Fulfilment') {
                    bpOptionMenuItems.push({itemLabel: 'Send Receipt Advice'});
                }
            }

            // messages for the seller
            else {
                if (processType == 'Order') {
                    bpOptionMenuItems.push({itemLabel:'Send Order Response'});
                } else if (processType == 'Negotiation') {
                    bpOptionMenuItems.push({itemLabel: 'Send Quotation'});
                }
            }

            // if the response is not null
        } else {
            if (processType == 'Order') {
                if(!buyer) {
                    let orderResponse: OrderResponseSimple = response.value;
                    if (orderResponse.acceptedIndicator == true) {
                        bpOptionMenuItems.push({itemLabel: 'Send Despatch Advice'});
                    }
                }
            }
        }*/
        return bpOptionMenuItems;
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

    isJson(str: string): boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

}
