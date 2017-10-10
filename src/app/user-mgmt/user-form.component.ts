import { Component } from '@angular/core';
import { UserService } from './user.service';
import * as myGlobals from '../globals';
import { UserRegistration } from './model/user-registration';
declare var jsSHA: any;

@Component({
    selector: 'user-form',
    templateUrl: './user-form.component.html'
})

export class UserFormComponent {

    submitted = false;
    callback = false;
    debug = myGlobals.debug;
    /* ToDo: Hackathon only BEGIN */
    model: UserRegistration = UserRegistration.initEmpty();
    objToSubmit: UserRegistration = UserRegistration.initEmpty();
    /* ToDo: Hackathon only END */
    response: any;
    shaObj: any;

    constructor(private userService: UserService) {
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

    onSubmit() {
        this.objToSubmit = JSON.parse(JSON.stringify(this.model));
        this.shaObj = new jsSHA("SHA-256", "TEXT");
        this.shaObj.update(this.model.credentials.password);
        this.objToSubmit.credentials.password = this.shaObj.getHash("HEX");
        // this.objToSubmit.dateOfBirth = new Date(this.model.dateOfBirth).toISOString(); // ToDo: add again to model
        this.submitted = true;
        this.post(this.objToSubmit);
    }

}