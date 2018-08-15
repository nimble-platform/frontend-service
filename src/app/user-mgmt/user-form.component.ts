import { Component, OnInit } from '@angular/core';
import { UserService } from './user.service';
import * as myGlobals from '../globals';
import { UserRegistration } from './model/user-registration';
import { ActivatedRoute } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from '@angular/router';
import { CallStatus } from '../common/call-status';
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
	eula_accepted = false;
    debug = myGlobals.debug;
    /* ToDo: Hackathon only BEGIN */
    model: UserRegistration = UserRegistration.initEmpty();
    objToSubmit: UserRegistration = UserRegistration.initEmpty();
    /* ToDo: Hackathon only END */
    response: any;
    shaObj: any;

    submitCallStatus: CallStatus = new CallStatus();

    constructor(
        private userService: UserService,
        private router: Router,
		private modalService: NgbModal,
        public route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['email']) {
                const test = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._-]+\.[a-z]{2,3}$/.test(params['email']);
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
        this.submitCallStatus.submit();
        this.userService.registerUser(userRegistration)
            .then(res => {
                this.response = res;
                this.submitCallStatus.callback("Registration Successful!");
                this.router.navigate(["/user-mgmt/login"], {queryParams: { pageRef: "registration" }});
            })
			.catch(error => {
				this.submitCallStatus.error("Registration failed - please make sure your account is not yet registered and try again later", error);
            });
    }

    reset() {
        this.submitCallStatus.reset();
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
        this.post(this.objToSubmit);
    }
	
	open(content) {
		this.modalService.open(content);
	}

}