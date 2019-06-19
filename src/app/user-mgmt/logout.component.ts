import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CookieService } from 'ng2-cookies';
import { UserService } from './user.service';
import { CategoryService } from '../catalogue/category/category.service';
import { CatalogueService } from '../catalogue/catalogue.service';
import * as constants from "../common/constants";
import {Headers, Http} from "@angular/http";
import * as myGlobals from "../globals";

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
        private catalogueService: CatalogueService,
        private http: Http
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

		// if rocket chat enabled

        let headers = new Headers({'Content-Type': 'application/json', 'X-Auth-Token': this.cookieService.get(constants.chatToken), 'X-User-Id': this.cookieService.get(constants.chatUserID)});
        const url = myGlobals.rocketChatEndpoint + '/api/v1/logout';
        this.http
            .post(url, JSON.stringify({}), {headers: headers})
            .toPromise()
            .then(res => {
                console.log(res);
                this.cookieService.delete(constants.chatRCConnect, '/');
                this.cookieService.delete(constants.chatRCToken, '/');
                this.cookieService.delete(constants.chatRCID, '/');

                this.cookieService.delete(constants.chatToken, '/');
                this.cookieService.delete(constants.chatUsername, '/');
                this.cookieService.delete(constants.chatUserID, '/');
            })
            .catch(e => {
                console.error("Error occurred while logging off from rocket chat");
            });

		this.userService.resetData();
		this.appComponent.checkLogin("/user-mgmt/login");
	}

}
