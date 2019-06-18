import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CookieService } from 'ng2-cookies';
import { UserService } from './user.service';
import { CategoryService } from '../catalogue/category/category.service';
import { CatalogueService } from '../catalogue/catalogue.service';
import * as constants from "../common/constants";

@Component({
	selector: 'nimble-logout',
	providers: [ CookieService ],
	templateUrl: './logout.component.html'
})

export class LogoutComponent implements OnInit {

	constructor(
		private cookieService: CookieService,
		private appComponent: AppComponent,
		private userService: UserService,
        private categoryService: CategoryService,
        private catalogueService: CatalogueService
	) {	}

	ngOnInit() {
		this.cookieService.delete("user_id");
		this.cookieService.delete("company_id");
		this.cookieService.delete("user_fullname");
		this.cookieService.delete("user_email");
		this.userService.resetData();
		this.categoryService.resetData();
		this.catalogueService.resetData();
		this.cookieService.delete("active_company_name");
		this.cookieService.delete("show_welcome");
		this.cookieService.delete("bearer_token");

		this.cookieService.delete(constants.chatRCConnect, '/');
		this.cookieService.delete(constants.chatRCToken, '/');
		this.cookieService.delete(constants.chatRCID, '/');

		this.cookieService.delete(constants.chatToken,'/');
		this.cookieService.delete(constants.chatUsername, '/');
		this.cookieService.delete(constants.chatUserID, '/');

		this.userService.resetData();
		this.appComponent.checkLogin("/user-mgmt/login");
	}

}
