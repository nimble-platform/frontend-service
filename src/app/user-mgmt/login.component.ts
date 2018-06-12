import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'nimble-login',
	templateUrl: './login.component.html'
})

export class LoginComponent implements OnInit {
	public pageRef: string = null;

	constructor(
		private route: ActivatedRoute
	) {	}
	ngOnInit() {
		this.route
			.queryParams
			.subscribe(params => {
				this.pageRef = params['pageRef'];
			});
	}
}