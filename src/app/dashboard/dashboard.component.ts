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
					"bp_status":this.getBPStatusByTaskName(task.processDefinitionKey, task.taskDefinitionKey),
					"start_time":new Date(task.startTime).toLocaleDateString()+"\n"+time_locale
				});

				this.bpeService.getProcessDetailsHistory(task.processInstanceId)
				.then(activityVariables => {

					var vProductName = "", vContent = "", vNote = "", vResponse = "", vBPStatus = "", vTask_id = "", vProcess_id = "", vStart_time = "", vSellerName = "";
					var vProcessType = activityVariables[0]["processDefinitionKey"];
					for (let variable of activityVariables) {
						vProcess_id = variable.processInstanceId;
						if (variable.name == "order") {
							vProductName = this.getProductNameFromProcessData(variable);
							vNote = this.getNoteFromProcessData(vProcessType, variable);
							vContent = variable.value;
							vSellerName = this.getResponderNameProcessData(variable);
						}
					}

					for (let t of this.buyer_history_temp) {
						if (t.process_id == vProcess_id) {
							vTask_id = t.task_id;
							vStart_time = t.start_time;
							vBPStatus = t.bp_status;
							if(t.bp_status == "Started") {
								vResponse = "Waiting for response";
							}
						}
					}

					this.buyer_history.push({
						"processType":vProcessType,
						"task_id":vTask_id,
						"process_id":vProcess_id,
						"start_time":vStart_time,
						"sellerName":vSellerName,
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
					"bp_status":this.getBPStatusByTaskName(task.processDefinitionKey, task.taskDefinitionKey),
					"start_time":new Date(task.startTime).toLocaleDateString()+"\n"+new Date(task.startTime).toLocaleTimeString()
				});

				this.bpeService.getProcessDetailsHistory(task.processInstanceId)
				.then(activityVariables => {

					var vProductName = "", vContent = "", vNote = "", vResponse = "", vBPStatus = "", vTask_id = "", vProcess_id = "", vStart_time = "", vBuyerName = "";
					var vProcessType = activityVariables[0]["processDefinitionKey"];
					for (let variable of activityVariables) {
						vProcess_id = variable.processInstanceId;
						if (variable.name == "order") {
							vProductName = this.getProductNameFromProcessData(variable);
							vNote = this.getNoteFromProcessData(variable.name, variable);
							vBuyerName = this.getInitiatorNameProcessData(variable);
							vContent = variable.value;
						}
					}

					for (let t of this.seller_history_temp) {
						if (t.process_id == vProcess_id) {
							vTask_id = t.task_id;
							vStart_time = t.start_time;
							vBPStatus = t.bp_status;
							if(t.bp_status == "Completed") {
								vResponse = "Responded";
							} else {
								vResponse = "Action Required";
							}
						}
					}

					this.seller_history.push({
						"processType":vProcessType,
						"task_id":vTask_id,
						"process_id":vProcess_id,
						"start_time":vStart_time,
						"buyerName":vBuyerName,
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

	placeOrder(obj: any) {
		// TODO handle the continuation with ordering after negotiation
		// let sellerId:string = obj.seller;
		// let buyerId:string = obj.buyer;
		// let vars:ProcessVariables = ModelUtils.createProcessVariables("Order", buyerId, sellerId, JSON.stringify(this.order));
		// let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");
        //
		// var order = new Order('','',null, null, []);

		/*order.amount = obj.order.amount;
		order.note = obj.order.message;
		order.product_id = obj.order.product_id;
		order.product_name = obj.order.product_name;*/
		/*orderObj.order = JSON.stringify(order);
		orderObj.seller = obj.seller;
		orderObj.sellerName = obj.sellerName;
		orderObj.buyer = obj.buyer;
		orderObj.buyerName = obj.buyerName;
		orderObj.connection = "|"+obj.seller+"|"+obj.buyer+"|";
		this.bpeService.placeOrder(orderObj)
		.then(res => {
			this.removeOrder(obj.process_id);
		})
		.catch(error => {
			this.loadOrders();
		});*/
	}
	
	respondToOrder(processId: string, order:Order, acceptedIndicator: boolean) {
		let orderResponse:OrderResponseSimple = UBLModelUtils.createOrderResponseSimple(order, acceptedIndicator);
		let vars:ProcessVariables = ModelUtils.createProcessVariables("Order", order.buyerCustomerParty.party.id, order.sellerSupplierParty.party.id, JSON.stringify(orderResponse));
		let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, processId);

		this.bpeService.continueBusinessProcess(piim)
		.then(res => {
			this.loadOrders();
		})
		.catch(error => {
			this.loadOrders();
		});
	}
	
	respondToRFQ(task: string, response: string, message: string) {
		var rfqResponse = new RequestForQuotationResponse('','');
		rfqResponse.response = response;
		rfqResponse.message = message;
		this.bpeService.respondToRFQ(task,rfqResponse)
		.then(res => {
			this.loadOrders();
		})
		.catch(error => {
			this.loadOrders();
		});
	}
	
	negotiate(obj: any) {
		this.cookieService.set("negotiation_details",JSON.stringify(obj),new Date(new Date().getTime()+5000));
		this.router.navigate(['/simple-search-details',obj.product_id]);
	}

	getResponderNameProcessData(variable:any):string {
		let processType:string = variable.processDefinitionKey;
		if(processType == "Order") {
			let order:Order = variable.value as Order;
			return order.sellerSupplierParty.party.name;
		} else if(processType == "Negotiation") {
			return "";
		}
	}

	getInitiatorNameProcessData(variable:any):string {
		let processType:string = variable.processDefinitionKey;
		if(processType == "Order") {
			let order:Order = variable.value as Order;
			return order.buyerCustomerParty.party.name;
		} else if(processType == "Negotiation") {
			return "";
		}
	}

	getProductNameFromProcessData(variable:any):string {
		let processType:string = variable.processDefinitionKey;
		if(processType == "Order") {
			let order:Order = variable.value as Order;
			return order.orderLine[0].lineItem.item.name;
		}  else if(processType == "Negotiation") {
			return "";
		}
	}

	getNoteFromProcessData(processType:string, content:any):string {
		if(processType == "Order") {
			let order:Order = content.value as Order;
			return order.note;
		} else if(processType == "Negotiation") {
			return "";
		}
	}

	// TODO make this process more generic instead of checking names of tasks
	getBPStatusByTaskName(processDefinitionKey:string, taskDefinitionKey:string):string {
		if(processDefinitionKey == "Order") {
			if (taskDefinitionKey == "WaitOrderResponse") {
				return "Started";
			} else {
				return "Completed";
			}

		} else if(processDefinitionKey == "Negotiation") {
			if (taskDefinitionKey == "WaitQuotation") {
				return "Started";
			} else {
				return "Completed";
			}
		}
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