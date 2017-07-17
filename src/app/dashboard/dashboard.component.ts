import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CookieService } from 'ng2-cookies';
import { BPEService } from '../bpe/bpe.service';
import { OrderResponse } from '../bpe/model/order-response';

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
		private appComponent: AppComponent
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
		this.bpeService.getBuyerHistory(this.cookieService.get("company_id"))
		.then(res => {
			this.buyer_history_temp = [];
			this.buyer_history = [];
			for (let task of res) {
				var time_offset = -(new Date().getTimezoneOffset() / 60);
				var time_locale = new Date(new Date().setTime(new Date(task.startTime).getTime() + (time_offset*60*60*1000))).toLocaleTimeString();
				this.buyer_history_temp.push({
					"task_id":task.id,
					"process_id":task.processInstanceId,
					"start_time":new Date(task.startTime).toLocaleDateString()+"\n"+time_locale
				});
				this.bpeService.getProcessDetailsHistory(task.processInstanceId)
				.then(res => {
					var vBuyer = "", vBuyerName = "", vSeller = "", vSellerName = "", vOrder = "", vOrderResponse = "", vTask_id = "", vProcess_id = "", vStart_time = "";
					var vProcessType = res[0]["processDefinitionKey"];
					for (let field of res) {
						vProcess_id = field.processInstanceId;
						if (field.name == "buyer")
							vBuyer = field.value;
						else if (field.name == "buyerName")
							vBuyerName = field.value;
						else if (field.name == "seller")
							vSeller = field.value;
						else if (field.name == "sellerName")
							vSellerName = field.value;
						else if (field.name == "order")
							vOrder = field.value;
						else if (field.name == "orderResponse")
							vOrderResponse = field.value;
						else if (field.name == "terms")
							vOrder = field.value;

						for (let t of this.buyer_history_temp) {
							if (t.process_id == vProcess_id) {
								vTask_id = t.task_id;
								vStart_time = t.start_time;
							}
						}
					}
					if (this.isJson(vOrder))
						vOrder = JSON.parse(vOrder);
					if (this.isJson(vOrderResponse))
						vOrderResponse = JSON.parse(vOrderResponse);
					this.buyer_history.push({
						"processType":vProcessType,
                        "task_id":vTask_id,
						"process_id":vProcess_id,
						"start_time":vStart_time,
						"buyer":vBuyer,
						"buyerName":vBuyerName,
						"seller":vSeller,
						"sellerName":vSellerName,
						"order":vOrder,
						"orderResponse":vOrderResponse,
					});
					this.buyer_history.sort(function(a:any,b:any){
						var a_comp = a.start_time;
						var b_comp = b.start_time;
						return b_comp.localeCompare(a_comp);
					});
				})
				.catch(error => {

				});
			}
		})
		.catch(error => {

		});
		this.bpeService.getSellerHistory(this.cookieService.get("company_id"))
		.then(res => {
			this.seller_history_temp = [];
			this.seller_history = [];
			for (let task of res) {
				this.seller_history_temp.push({
					"task_id":task.id,
					"process_id":task.processInstanceId,
					"start_time":new Date(task.startTime).toLocaleDateString()+"\n"+new Date(task.startTime).toLocaleTimeString()
				});
				this.bpeService.getProcessDetailsHistory(task.processInstanceId)
				.then(res => {
					var vBuyer = "", vBuyerName = "", vSeller = "", vSellerName = "", vOrder = "", vOrderResponse = "", vTask_id = "", vProcess_id = "", vStart_time = "";
					var vProcessType = res[0]["processDefinitionKey"];
					for (let field of res) {
						vProcess_id = field.processInstanceId;
						if (field.name == "buyer")
							vBuyer = field.value;
						else if (field.name == "buyerName")
							vBuyerName = field.value;
						else if (field.name == "seller")
							vSeller = field.value;
						else if (field.name == "sellerName")
							vSellerName = field.value;
						else if (field.name == "order")
							vOrder = field.value;
						else if (field.name == "orderResponse")
							vOrderResponse = field.value;
						else if (field.name == "terms")
							vOrder = field.value;
						for (let t of this.seller_history_temp) {
							if (t.process_id == vProcess_id) {
								vTask_id = t.task_id;
								vStart_time = t.start_time;
							}
						}
					}
					if (this.isJson(vOrder))
						vOrder = JSON.parse(vOrder);
					if (this.isJson(vOrderResponse))
						vOrderResponse = JSON.parse(vOrderResponse);
					this.seller_history.push({
						"processType":vProcessType,
						"task_id":vTask_id,
						"process_id":vProcess_id,
						"start_time":vStart_time,
						"buyer":vBuyer,
						"buyerName":vBuyerName,
						"seller":vSeller,
						"sellerName":vSellerName,
						"order":vOrder,
						"orderResponse":vOrderResponse
					});
					this.seller_history.sort(function(a:any,b:any){
						var a_comp = a.start_time;
						var b_comp = b.start_time;
						return b_comp.localeCompare(a_comp);
					});
				})
				.catch(error => {

				});
			}
		})
		.catch(error => {

		});
	}

	respondToOrder(task: string, response: string) {
		var orderResponse = new OrderResponse('','');
		orderResponse.response = response;
		this.bpeService.respondToOrder(task,orderResponse)
		.then(res => {
			this.loadOrders();
		})
		.catch(error => {
			this.loadOrders();
		});
	}

	removeOrder(process:string) {
		this.bpeService.removeOrder(process)
		.then(res => {
			this.loadOrders();
		})
		.catch(error => {
			this.loadOrders();
		});
	}

	cancelOrder(process:string) {
		this.bpeService.cancelOrder(process)
		.then(res => {
			this.removeOrder(process);
		})
		.catch(error => {
			this.removeOrder(process);
		});
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