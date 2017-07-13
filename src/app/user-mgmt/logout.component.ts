import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CookieService } from 'ng2-cookies';
import {CategoryService} from "../catalogue/category/category.service";
import {CatalogueService} from "../catalogue/catalogue.service";
import {UserService} from "./user.service";

@Component({
	selector: 'nimble-logout',
	providers: [ CookieService ],
	templateUrl: './logout.component.html'
})

export class LogoutComponent implements OnInit {

	constructor(
		private cookieService: CookieService,
		private userService:UserService,
		private categoryService: CategoryService,
		private catalogueService: CatalogueService,
		private appComponent: AppComponent
	) {	}

	ngOnInit() {
		this.cookieService.delete("user_id");
		this.cookieService.delete("company_id");
		this.cookieService.delete("user_fullname");
		this.cookieService.delete("user_email");
		this.userService.resetData();
		this.categoryService.resetData();
		this.catalogueService.resetData();
		this.appComponent.checkLogin("/login");
	}

}