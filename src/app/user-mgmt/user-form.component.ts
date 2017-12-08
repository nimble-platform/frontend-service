import { Component, OnInit } from '@angular/core';
import { UserService } from './user.service';
import * as myGlobals from '../globals';
import { UserRegistration } from './model/user-registration';
import { ActivatedRoute } from "@angular/router";
//declare var jsSHA: any;
@Component({
    selector: 'user-form',
    templateUrl: './user-form.component.html'
})

export class UserFormComponent implements OnInit {

    password_validate = "";
    pw_val_class = "ng-valid";
    passwords_matching = false;
    email_preset = false;
    submitted = false;
    callback = false;
    debug = myGlobals.debug;
    /* ToDo: Hackathon only BEGIN */
    model: UserRegistration = UserRegistration.initEmpty();
    objToSubmit: UserRegistration = UserRegistration.initEmpty();
    /* ToDo: Hackathon only END */
    response: any;
    shaObj: any;

    constructor(
        private userService: UserService,
        public route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['email']) {
                const test = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/.test(params['email']);
                if (test) {
                    this.model.user.email = params['email'];
                    this.email_preset = true;
                }
                else {
                    this.model.user.email = "";
                    this.email_preset = false;
                }
            }
            else {
                this.model.user.email = "";
                this.email_preset = false;
            }
        });
    }

    post(userRegistration: UserRegistration): void {
        userRegistration.credentials.username = userRegistration.user.email;
        userRegistration.user.username = userRegistration.user.email;
        this.userService.registerUser(userRegistration)
            .then(res => {
                this.response = res;
                this.callback = true;
            });
    }

    reset() {
        this.submitted = false;
        this.callback = false;
        /* ToDo: Hackathon only BEGIN */
        this.model = UserRegistration.initEmpty();
        this.objToSubmit = UserRegistration.initEmpty();
        //model = new User('','','','','','','','','');
        //objToSubmit = new User('','','','','','','','','');
        /* ToDo: Hackathon only END */
    }

    validatePW() {
        const pw = this.model.credentials.password;
        const pw_val = this.password_validate;
        if (pw.localeCompare(pw_val) == 0) {
            this.passwords_matching = true;
            this.pw_val_class = "ng-valid";
        }
        else {
            this.passwords_matching = false;
            this.pw_val_class = "ng-invalid";
        }
    }

    onSubmit() {
        this.objToSubmit = JSON.parse(JSON.stringify(this.model));
        /*
        this.shaObj = new jsSHA("SHA-256", "TEXT");
        this.shaObj.update(this.model.credentials.password);
        this.objToSubmit.credentials.password = this.shaObj.getHash("HEX");
        */
        // this.objToSubmit.dateOfBirth = new Date(this.model.dateOfBirth).toISOString(); // ToDo: add again to model
        this.submitted = true;
        this.post(this.objToSubmit);
    }

}