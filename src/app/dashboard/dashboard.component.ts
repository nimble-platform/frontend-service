import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CookieService } from 'ng2-cookies';
import { BPEService } from '../bpe/bpe.service';

@Component({
	selector: 'nimble-dashboard',
	providers: [ CookieService ],
	templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit {

	fullName = "";
	tasks: any;
	buyer: any;
	seller: any;

	constructor(
		private cookieService: CookieService,
		private bpeService: BPEService,
		private appComponent: AppComponent
	) {	}
	
	ngOnInit() {
		if (this.cookieService.get("user_fullname"))
			this.fullName = this.cookieService.get("user_fullname");
		if (this.cookieService.get("user_id") && this.cookieService.get("company_id")) {
			this.tasks = [];
			this.buyer = [];
			this.seller = [];
			this.bpeService.getOrders(this.cookieService.get("company_id"))
			.then(res => {
				for (let task of res) {
					this.tasks.push({
						"task_id":task.id,
						"process_id":task.processInstanceId
					});
					this.bpeService.getProcessDetails(task.processInstanceId)
					.then(res => {
						var vBuyer = "", vSeller = "", vOrder = "", vTask_id = "", vProcess_id = "";
						for (let field of res) {
							vProcess_id = field.processInstanceId;
							if (field.name == "buyer")
								vBuyer = field.value;
							else if (field.name == "seller")
								vSeller = field.value;
							else if (field.name == "order")
								vOrder = field.value;
							for (let t of this.tasks) {
								if (t.process_id == vProcess_id)
									vTask_id = t.task_id;
							}
						}
						if (vBuyer == this.cookieService.get("company_id")) {
							this.buyer.push({
								"task_id":vTask_id,
								"process_id":vProcess_id,
								"buyer":vBuyer,
								"seller":vSeller,
								"order":vOrder
							});
						}
						else {
							this.seller.push({
								"task_id":vTask_id,
								"process_id":vProcess_id,
								"buyer":vBuyer,
								"seller":vSeller,
								"order":vOrder
							});
						}
					})
					.catch(error => {
						
					});
				}
			})
			.catch(error => {
				
			});
		}
		else
			this.appComponent.checkLogin("/login");
	}

}