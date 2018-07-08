import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'nimble-login',
	templateUrl: './login.component.html'
})

export class LoginComponent implements OnInit {
	public pageRef: string = null;

	constructor(
		private route: ActivatedRoute,
		private renderer: Renderer2) {
			this.renderer.setStyle(document.body, "background-image", "url('../assets/Background_Login_1.jpg')");
		}

	ngOnInit() {
		this.route
			.queryParams
			.subscribe(params => {
				this.pageRef = params['pageRef'];
			});
	}

	ngOnDestroy() {
		this.renderer.setStyle(document.body, "background-image", "url('../assets/background_All.jpg')");
	}
}