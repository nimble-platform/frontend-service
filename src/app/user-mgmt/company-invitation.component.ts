import { Component, OnInit } from '@angular/core';
import { CompanyInvitation } from './model/company-invitation';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import * as myGlobals from '../globals';

@Component({
    selector: 'company-invitation',
    templateUrl: './company-invitation.component.html'
})

export class CompanyInvitationComponent implements OnInit {

	invEmail = "";
	invPending = [];
	submitted = false;
    callback = false;
	callback2 = false;
	error_detc = false;

    constructor(
        private cookieService: CookieService,
        private userService: UserService
	) {}
	
	ngOnInit() {
        this.loadInvites();
    }
	
	loadInvites() {
		this.callback2 = false;
		this.userService.getInviteList()
            .then(response => {
                this.invPending = response;
				this.callback2 = true;
            })
			.catch(error => {
				this.invPending = [];
				this.callback2 = true;
                console.error('An error occurred', error); // for demo purposes only
            });
	}

	onSubmit() {
		let companyId = this.cookieService.get('company_id');
		let companyInvitation: CompanyInvitation = new CompanyInvitation(companyId, this.invEmail);
		if (myGlobals.debug)
			console.log(`Sending invitation ${JSON.stringify(companyInvitation)}`);
		this.submitted = true;
		this.callback = false;
		this.error_detc = false;
		this.userService.inviteCompany(companyInvitation)
            .then(response => {
                this.submitted = false;
				this.callback = true;
				this.error_detc = false;
				this.loadInvites();
            })
			.catch(error => {
                console.error('An error occurred', error); // for demo purposes only
				if (error.status == 400)
					this.error_detc = true;
            });
    }
	
}