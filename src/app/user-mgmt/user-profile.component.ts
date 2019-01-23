import { Component, OnInit } from "@angular/core";
import { UserService } from './user.service';
import { Person } from '../catalogue/model/publish/person';
import { CookieService } from 'ng2-cookies';
import { CallStatus } from '../common/call-status';
import { ResetPasswordCredentials } from './model/reset-password-credentials';

@Component({
    selector: "user-profile",
    templateUrl: "./user-profile.component.html",
    styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

    userProfile: Person = null;
    callStatus: CallStatus = new CallStatus();
    changePasswordCallStatus: CallStatus = new CallStatus();
    changePasswordCredentials: ResetPasswordCredentials = new ResetPasswordCredentials(null, null);
    newPasswordRepeated: string = null;
    pw_val_class: string = "ng-invalid";
    passwords_matching: boolean = false;

    constructor(private userService: UserService,
                private cookieService: CookieService,
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
}
