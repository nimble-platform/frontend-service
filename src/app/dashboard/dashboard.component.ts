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

@Component({
	selector: 'nimble-dashboard',
	providers: [ CookieService ],
	templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit {

	fullName = "";
	buyer_history_temp: any;
	buyer_history: any;
	seller_history_temp: any;
	seller_history: any;

	constructor(
		private cookieService: CookieService,
		private bpeService: BPEService,
		private router: Router,
		private appComponent: AppComponent,
		private userService: UserService
	) {	}

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
				var time_locale = new Date(new Date().setTime(new Date(task.startTime).getTime() + (time_offset*60*60*1000))).toLocaleTimeString();
				this.buyer_history_temp.push({
					"task_id":task.id,
					"task_name":task.name,
					"task_description":task.description,
					"process_id":task.processInstanceId,
					"start_time":new Date(task.startTime).toLocaleDateString()+"\n"+time_locale
				});

				this.bpeService.getProcessDetailsHistory(task.processInstanceId)
				.then(activityVariables => {

					var vProductName = "", vContent = "", vNote = "", vResponse = "", vBPStatus = "", vTask_id = "", vProcess_id = "", vStart_time = "", vSellerName = "", vProductId;
					var vProcessType = activityVariables[0]["processDefinitionKey"];
					let response:any = this.getResponse(activityVariables);
					let initialDoc:any = this.getInitialDocument(activityVariables);
					vProductId = this.getProducIdFromProcessData(initialDoc);
					vProductName = this.getProductNameFromProcessData(initialDoc);
					vNote = this.getNoteFromProcessData(initialDoc);
					vSellerName = this.getInitiatorNameProcessData(initialDoc);
					vProcess_id = initialDoc.processInstanceId;
					vResponse = this.getResponseMessage(response, true);
					vBPStatus = this.getBPStatus(response);
					vContent = initialDoc.value;

					for (let t of this.buyer_history_temp) {
						if (t.process_id == vProcess_id) {
							vTask_id = t.task_id;
							vStart_time = t.start_time;
						}
					}

					this.buyer_history.push({
						"processType":vProcessType,
						"task_id":vTask_id,
						"process_id":vProcess_id,
						"start_time":vStart_time,
						"sellerName":vSellerName,
						"productId": vProductId,
						"product_name":vProductName,
						"note":vNote,
						"status":vBPStatus,
						"response":vResponse,
						"content":vContent
					});

					this.buyer_history.sort(function(a:any,b:any){
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
					"task_id":task.id,
					"task_name":task.name,
					"task_description":task.description,
					"process_id":task.processInstanceId,
					"start_time":new Date(task.startTime).toLocaleDateString()+"\n"+new Date(task.startTime).toLocaleTimeString()
				});

				this.bpeService.getProcessDetailsHistory(task.processInstanceId)
				.then(activityVariables => {

					var vProductName = "", vContent = "", vNote = "", vResponse = "", vBPStatus = "", vTask_id = "", vProcess_id = "", vStart_time = "", vBuyerName = "", vProductId;
					var vProcessType = activityVariables[0]["processDefinitionKey"];
					let response:any = this.getResponse(activityVariables);
					let initialDoc:any = this.getInitialDocument(activityVariables);
					vProductId = this.getProducIdFromProcessData(initialDoc);
					vProductName = this.getProductNameFromProcessData(initialDoc);
					vNote = this.getNoteFromProcessData(initialDoc);
					vBuyerName = this.getInitiatorNameProcessData(initialDoc);
					vProcess_id = initialDoc.processInstanceId;
					vResponse = this.getResponseMessage(response, false);
					vBPStatus = this.getBPStatus(response);
					vContent = initialDoc.value;

					for (let t of this.seller_history_temp) {
						if (t.process_id == vProcess_id) {
							vTask_id = t.task_id;
							vStart_time = t.start_time;
						}
					}

					this.seller_history.push({
						"processType":vProcessType,
						"task_id":vTask_id,
						"process_id":vProcess_id,
						"start_time":vStart_time,
						"buyerName":vBuyerName,
						"productId": vProductId,
						"product_name":vProductName,
						"note":vNote,
						"status":vBPStatus,
						"response":vResponse,
						"content":vContent
					});
					this.seller_history.sort(function(a:any,b:any){
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

	respondToOrder(processId: string, order:Order, acceptedIndicator: boolean) {
		let orderResponse:OrderResponseSimple = UBLModelUtils.createOrderResponseSimple(order, acceptedIndicator);
		let vars:ProcessVariables = ModelUtils.createProcessVariables("Order", order.buyerCustomerParty.party.id, order.sellerSupplierParty.party.id, orderResponse);
		let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, processId);

		this.bpeService.continueBusinessProcess(piim)
		.then(res => {
			this.loadOrders();
		})
		.catch(error => {
			this.loadOrders();
		});
	}
	
	respondToRFQ(processId: string, rfq:RequestForQuotation, acceptedIndicator:boolean) {
		let quotation:Quotation = UBLModelUtils.createQuotation(rfq);
		if(acceptedIndicator == false) {
			quotation.lineCountNumeric = 0;
			quotation.quotationLine = [];
		}
		let vars:ProcessVariables = ModelUtils.createProcessVariables("Order", quotation.buyerCustomerParty.party.id, quotation.sellerSupplierParty.party.id, quotation);
		let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, processId);

		this.bpeService.continueBusinessProcess(piim)
            .then(res => {
				this.loadOrders();
			})
            .catch(error => {
				this.loadOrders();
			});
		}
	
	getResponderNameProcessData(variable:any):string {
		let processType:string = variable.processDefinitionKey;
		if(processType == "Order") {
			let order:Order = variable.value as Order;
			return order.sellerSupplierParty.party.name;
		} else if(processType == "Negotiation") {
			let rfq:RequestForQuotation = variable.value as RequestForQuotation;
			return rfq.sellerSupplierParty.party.name;
		}
	}

	getInitiatorNameProcessData(variable:any):string {
		let processType:string = variable.processDefinitionKey;
		if(processType == "Order") {
			let order:Order = variable.value as Order;
			return order.buyerCustomerParty.party.name;
		} else if(processType == "Negotiation") {
			let rfq:RequestForQuotation = variable.value as RequestForQuotation;
			return rfq.buyerCustomerParty.party.name;
		}
	}

	getProducIdFromProcessData(variable:any):string {
		let processType:string = variable.processDefinitionKey;
		if(processType == "Order") {
			let order:Order = variable.value as Order;
			return order.orderLine[0].lineItem.lineReference[0].lineID;
		}  else if(processType == "Negotiation") {
			let rfq:RequestForQuotation = variable.value as RequestForQuotation;
			return rfq.requestForQuotationLine[0].lineItem.lineReference[0].lineID;
		}
	}


	getProductNameFromProcessData(variable:any):string {
		let processType:string = variable.processDefinitionKey;
		if(processType == "Order") {
			let order:Order = variable.value as Order;
			return order.orderLine[0].lineItem.item.name;
		}  else if(processType == "Negotiation") {
			let rfq:RequestForQuotation = variable.value as RequestForQuotation;
			return rfq.requestForQuotationLine[0].lineItem.item.name;
		}
	}

	getNoteFromProcessData(variable:any):string {
		let processType:string = variable.processDefinitionKey;
		if(processType == "Order") {
			let order:Order = variable.value as Order;
			return order.note;
		} else if(processType == "Negotiation") {
			let rfq:RequestForQuotation = variable.value as RequestForQuotation;
			return rfq.note[0];
		}
	}

	getResponseMessage(response:any, buyer:boolean):string {
		let responseMessage;
		if(response == null) {
			if(buyer) {
				responseMessage = "Waiting for response";
			} else {
				responseMessage = "Action required";
			}
		} else {
			if(response.name == 'orderResponse') {
				if (response.value.acceptedIndicator) {
					responseMessage = "Approved";
				} else {
					responseMessage = "Declined";
				}
			} else if(response.name == 'quotation') {
				if (response.value.lineCountNumeric > 0) {
					responseMessage = "Approved";
				} else {
					responseMessage = "Declined";
				}
			}
		}
		return responseMessage;
	}

	getBPStatus(response:any):string {
		let bpStatus;
		if(response == null) {
			bpStatus = "Started";
		} else {
			bpStatus = "Completed";
		}
		return bpStatus;
	}

	getInitialDocument(processVariables:any[]):any {
		for (let variable of processVariables) {
			if (variable.name == "order" || variable.name == "requestForQuotation") {
				return variable;
			}
		}
		return null;
	}

	getResponse(processVariables:any[]):any {
		for (let variable of processVariables) {
			if (variable.name == "orderResponse" || variable.name == "quotation") {
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