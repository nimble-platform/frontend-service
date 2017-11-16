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
import {BPDataService} from "../bpe/bp-data-service";
import {ActivityVariableParser} from "../bpe/activity-variable-parser";
import {Quotation} from "../catalogue/model/publish/quotation";
import {OrderResponseSimple} from "../catalogue/model/publish/order-response-simple";
import {Order} from "../catalogue/model/publish/order";

@Component({
    selector: 'nimble-dashboard',
    providers: [CookieService],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {

    fullName = "";
	hasCompany = false;
	roles = [];
	alert1Closed = false;
	alert2Closed = false;
    buyer_history_temp: any;
    buyer_history: any;
    seller_history_temp: any;
    seller_history: any;

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
			if (this.cookieService.get("active_company_name")) {
				if (this.cookieService.get("active_company_name") == null || this.cookieService.get("active_company_name") == "null")
					this.hasCompany = false;
				else
					this.hasCompany = true;
			}
			else
				this.hasCompany = false;
            this.buyer_history_temp = [];
            this.buyer_history = [];
            this.seller_history_temp = [];
            this.seller_history = [];
            this.loadOrders();
        }
        else
            this.appComponent.checkLogin("/login");
		if (this.cookieService.get('bearer_token')) {
			const at = this.cookieService.get('bearer_token');
			if (at.split(".").length == 3) {
				const at_payload = at.split(".")[1];
				try {
					const at_payload_json = JSON.parse(atob(at_payload));
					const at_payload_json_roles = at_payload_json["realm_access"]["roles"];
					this.roles = at_payload_json_roles;
				}
				catch(e){}
			}
		}
		else
			this.roles = [];
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

                            var vContent = "", vNote = "", vActionStatus = "", vBPStatus = "",
                                vTask_id = "", vProcess_id = "", vStart_time = "", vSellerName = "", vProduct,
                                vBpOptionMenuItems: any;
                            var vProcessType = ActivityVariableParser.getProcessType(activityVariables);
                            let response: any = ActivityVariableParser.getResponse(activityVariables);
                            let initialDoc: any = ActivityVariableParser.getInitialDocument(activityVariables);
                            vProduct = ActivityVariableParser.getProductFromProcessData(initialDoc);
                            vNote = ActivityVariableParser.getNoteFromProcessData(initialDoc);
                            vSellerName = ActivityVariableParser.getResponderNameProcessData(initialDoc);
                            vProcess_id = initialDoc.processInstanceId;
                            vActionStatus = this.getActionStatus(vProcessType, response, true);
                            vBPStatus = this.getBPStatus(response);
                            vContent = initialDoc.value;
                            vBpOptionMenuItems = this.getBpOptionsMenuItems(vProcessType, response, true);

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
                                "product": vProduct,
                                "note": vNote,
                                "processStatus": vBPStatus,
                                "actionStatus": vActionStatus,
                                "content": vContent,
                                "activityVariables": activityVariables,
                                "bpOptionMenuItems": vBpOptionMenuItems
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

                            var vContent = "", vNote = "", vActionStatus = "", vBPStatus = "",
                                vTask_id = "", vProcess_id = "", vStart_time = "", vBuyerName = "", vProduct,
                                vBpOptionMenuItems: any;
                            var vProcessType = ActivityVariableParser.getProcessType(activityVariables);
                            let response: any = ActivityVariableParser.getResponse(activityVariables);
                            let initialDoc: any = ActivityVariableParser.getInitialDocument(activityVariables);
                            vProduct = ActivityVariableParser.getProductFromProcessData(initialDoc);
                            vNote = ActivityVariableParser.getNoteFromProcessData(initialDoc);
                            vBuyerName = ActivityVariableParser.getInitiatorNameProcessData(initialDoc);
                            vProcess_id = initialDoc.processInstanceId;
                            vActionStatus = this.getActionStatus(vProcessType, response, false);
                            vBPStatus = this.getBPStatus(response);
                            vContent = initialDoc.value;
                            vBpOptionMenuItems = this.getBpOptionsMenuItems(vProcessType, response, false);

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
                                "product": vProduct,
                                "note": vNote,
                                "processStatus": vBPStatus,
                                "actionStatus": vActionStatus,
                                "content": vContent,
                                "activityVariables": activityVariables,
                                "bpOptionMenuItems": vBpOptionMenuItems
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

    navigateToProductDetailsPage(): void {
        this.router.navigate(['publish'], {queryParams: {pageRef: "catalogue"}});
    }

    openBpProcessView(role: string, targetProcess:string, processMetadata: any) {
        if(targetProcess == null) {
            targetProcess = ActivityVariableParser.getProcessType(processMetadata.activityVariables);
        }

        this.bpDataService.setBpOptionParameters_NavFromDashboard(role, targetProcess, processMetadata);
        this.router.navigate(['bpe-exec'], {
            queryParams: {
                catalogueId: processMetadata.product.catalogueDocumentReference.id,
                id: processMetadata.product.manufacturersItemIdentification.id
            }
        });
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
            }
        }
        return responseMessage;
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