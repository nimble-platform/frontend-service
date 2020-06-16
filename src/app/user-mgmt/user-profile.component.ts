/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Component, OnInit } from "@angular/core";
import { UserService } from './user.service';
import { Person } from '../catalogue/model/publish/person';
import { CookieService } from 'ng2-cookies';
import { CallStatus } from '../common/call-status';
import { TranslateService } from '@ngx-translate/core';
import { ResetPasswordCredentials } from './model/reset-password-credentials';
import { Router } from "@angular/router";
import { AppComponent } from "../app.component";

@Component({
    selector: "user-profile",
    templateUrl: "./user-profile.component.html",
    styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

    userProfile: Person = null;
    callStatus: CallStatus = new CallStatus();
    deleteUserCallStatus: CallStatus = new CallStatus();
    changePasswordCallStatus: CallStatus = new CallStatus();
    changePasswordCredentials: ResetPasswordCredentials = new ResetPasswordCredentials(null, null);
    newPasswordRepeated: string = null;
    pw_val_class: string = "ng-invalid";
    passwords_matching: boolean = false;

    constructor(private userService: UserService,
        private translate: TranslateService,
        private cookieService: CookieService,
        private router: Router,
        public appComponent: AppComponent
    ) {

    }

    ngOnInit() {

        this.callStatus.submit();

        let userId = this.cookieService.get("user_id");
        this.userService
            .getPerson(userId)
            .then(res => {
                this.callStatus.callback("Successfully loaded user profile", true);
                this.userProfile = res;
            })
            .catch(error => {
                this.callStatus.error("Invalid credentials", error);
            });
    }

    onChangePasswordSubmit(): void {
        this.changePasswordCallStatus.submit();
        this.userService.resetPassword(this.changePasswordCredentials)
            .then(res => {
                this.changePasswordCallStatus.callback("Successfully changed password");

            })
            .catch(error => {
                this.changePasswordCallStatus.error("Error while changing password", error);
            });

    }


    validatePasswords() {
        if (this.changePasswordCredentials.newPassword.localeCompare(this.newPasswordRepeated) == 0) {
            this.passwords_matching = true;
            this.pw_val_class = "ng-valid";
        }
        else {
            this.passwords_matching = false;
            this.pw_val_class = "ng-invalid";
        }
    }

    deleteUser(user): void {
        if (confirm(this.translate.instant("Are you sure that you want to delete this user?"))) {
            this.deleteUserCallStatus.submit();
            this.userService.deleteUser(user.hjid)
                .then(res => {
                    this.deleteUserCallStatus.callback("Successfully deleted user");
                    this.router.navigate(['/user-mgmt/logout']);
                })
                .catch(error => {
                    this.deleteUserCallStatus.error("Error while deleting user", error);
                });
        }
    }

}
