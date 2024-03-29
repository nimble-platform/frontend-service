/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CookieService } from 'ng2-cookies';
import { UserService } from './user.service';
import { CategoryService } from '../catalogue/category/category.service';
import { CredentialsService } from "./credentials.service";
import { ForgotPasswordCredentials } from "./model/forgot-password-credentials";
import { CallStatus } from "../common/call-status";
import { ActivatedRoute } from "@angular/router";

@Component({
    selector: 'nimble-forgot',
    providers: [CookieService],
    templateUrl: './forgot-password.component.html'
})

export class ForgotPasswordComponent implements OnInit {

    showSuccessEmail = false;
    showErrorMessage = false;
    model = new ForgotPasswordCredentials('', '', '');
    key = null;
    newPasswordRepeated: string = null;
    passwords_matching: boolean = false;
    pw_val_class: string = "ng-invalid";

    constructor(
        private route: ActivatedRoute,
        private cookieService: CookieService,
        private appComponent: AppComponent,
        private userService: UserService,
        private categoryService: CategoryService,
        private credentialsService: CredentialsService
    ) { }


    ngOnInit() {
        this.route
            .queryParams
            .subscribe(params => {
                if (params['key'] !== undefined)
                    this.key = params['key'];
            });
    }


    submitCallStatus: CallStatus = new CallStatus();

    resetPasswordViaRecoveryProcess(): void {
        this.submitCallStatus.submit();
        this.credentialsService.passwordRecoveryAction(this.model)
            .then(res => {
                this.showSuccessEmail = true;
                this.submitCallStatus.callback("You should receive an email shortly with further instructions.");
            })
            .catch(error => {
                this.showErrorMessage = true;
                this.submitCallStatus.error("Invalid email", error);
            });
    }

    resetForgotPassword(): void {
        this.submitCallStatus.submit();
        this.model.key = this.key;
        this.credentialsService.resetPassword(this.model)
            .then(res => {
                this.showSuccessEmail = true;
                this.submitCallStatus.callback("Password Reset Successfully!");
                setTimeout(() => {
                    this.appComponent.checkLogin("/dashboard");
                }, 2000);
            })
            .catch(error => {
                this.showErrorMessage = true;
                if (error.status == 404) {
                    this.submitCallStatus.error("Invalid email", error);
                } else if (error.status == 400) {
                    this.submitCallStatus.error("Invalid Link", error);
                } else if (error.status == 401) {
                    this.submitCallStatus.error("Link Expired", error);
                } else {
                    this.submitCallStatus.error("Error occurred while resetting the password", error);
                }
            });
    }

    validatePasswords() {
        if (this.model.newPassword.localeCompare(this.newPasswordRepeated) == 0) {
            this.passwords_matching = true;
            this.pw_val_class = "ng-valid";
        }
        else {
            this.passwords_matching = false;
            this.pw_val_class = "ng-invalid";
        }
    }

}
