import { Component } from '@angular/core';
import { User } from './user';
import { UserService } from './user.service';
import * as myGlobals from './globals';
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
	model = new User('','','','','','','','','','','','');
	objToSubmit = new User('','','','','','','','','','','','');
	response = new User('','','','','','','','','','','','');
	//model = new User('','','','','','','','','');
	//objToSubmit = new User('','','','','','','','','');
	//response = new User('','','','','','','','','');
	/* ToDo: Hackathon only END */
	shaObj: any;

	constructor(
		private userService: UserService
	) {
	}
	
	post(user: User): void {
		this.userService.post(user)
		.then(user => {
			this.response = user;
			this.callback = true;
		});
	}
  
	reset() {
		this.submitted = false;
		this.callback = false;
		/* ToDo: Hackathon only BEGIN */
		this.model = new User('','','','','','','','','','','','');
		this.objToSubmit = new User('','','','','','','','','','','','');
		this.response = new User('','','','','','','','','','','','');
		//model = new User('','','','','','','','','');
		//objToSubmit = new User('','','','','','','','','');
		//response = new User('','','','','','','','','');
		/* ToDo: Hackathon only END */
	}
  
	onSubmit() {
		this.objToSubmit = JSON.parse(JSON.stringify(this.model));
		this.shaObj = new jsSHA("SHA-256", "TEXT");
		this.shaObj.update(this.model.password);
        this.objToSubmit.password = this.shaObj.getHash("HEX");
		//this.objToSubmit.dateOfBirth = new Date(this.model.dateOfBirth).toISOString();
		this.submitted = true;
		this.post(this.objToSubmit);
	}
	
}