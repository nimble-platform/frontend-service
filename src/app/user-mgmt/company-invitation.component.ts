import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { CompanyInvitation } from './model/company-invitation';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from '../globals';

@Component({
    selector: 'company-invitation',
	templateUrl: './company-invitation.component.html',
    styleUrls: ['./company-invitation.component.css']
})

export class CompanyInvitationComponent implements OnInit {

	myEmail = "";
	invEmail = "";
	invRoles = [];
	invPending = [];
	invToChange = "";
	userRoles = [];
	rolesSelected = false;
	rolesChangeSelected = true;
	submitted = false;
    callback = false;
	callback2 = false;
	callback3 = false;
	error_detc = false;

    constructor(
        private cookieService: CookieService,
        private userService: UserService,
		private appComponent: AppComponent,
		private modalService: NgbModal
	) {}
	
	ngOnInit() {
		this.loadInvites();
		this.loadRoles();
		if (this.cookieService.get('user_email'))
			this.myEmail = decodeURIComponent(this.cookieService.get('user_email'));
    }
	
	checkMail(mail) {
		return (mail.localeCompare(this.myEmail) == 0);
	}
	
	checkDisable(role) {
		var disable = false;
		if (role == "external_representative" || role == "legal_representative") {
			if (!this.appComponent.checkRoles("legal"))
				disable = true;
		}
		return disable;
	}
	
	loadInvites() {
		this.invPending = [];
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
	
	loadRoles() {
		this.userRoles = [];
		this.callback3 = false;
		this.userService.getUserRoles()
            .then(response => {
				response.sort(function(a,b){
					var a_comp = a.name;
					var b_comp = b.name;
					return a_comp.localeCompare(b_comp);
				});
                this.userRoles = response;
				this.callback3 = true;
            })
			.catch(error => {
				this.userRoles = [];
				this.callback3 = true;
                console.error('An error occurred', error); // for demo purposes only
            });
	}
	
	setRoles(id) {
		if (this.invRoles.indexOf(id) == -1)
			this.invRoles.push(id);
		else
			this.invRoles.splice(this.invRoles.indexOf(id),1);
		if (this.invRoles.length > 0)
			this.rolesSelected = true;
		else
			this.rolesSelected = false;
	}
	
	setChangeRoles(id) {
		if (this.invToChange["roleIDs"].indexOf(id) == -1)
			this.invToChange["roleIDs"].push(id);
		else
			this.invToChange["roleIDs"].splice(this.invToChange["roleIDs"].indexOf(id),1);
		if (this.invToChange["roleIDs"].length > 0)
			this.rolesChangeSelected = true;
		else
			this.rolesChangeSelected = false;
	}
	
	changeRoles() {
		this.userService.setRoles(this.invToChange["email"],this.invToChange["roleIDs"])
			.then(response => {
				this.loadInvites();
            })
			.catch(error => {
                console.error('An error occurred', error);
				this.loadInvites();
            });
	}
	
	editRole(inv) {
		if (this.isJson(JSON.stringify(inv))) {
			this.invToChange = JSON.parse(JSON.stringify(inv));
		}
	}
	
	openModal(content) {
		this.modalService.open(content);
	}
	
	deleteInvite(inv) {
		if (confirm("Are you sure that you want to remove this user from your company?")) {
			this.userService.deleteInvite(inv["email"])
				.then(response => {
					this.loadInvites();
				})
				.catch(error => {
					console.error('An error occurred', error);
					this.loadInvites();
				});
		}
	}

	onSubmit() {
		let companyId = this.cookieService.get('company_id');
		let companyInvitation: CompanyInvitation = new CompanyInvitation(companyId, this.invEmail, this.invRoles);
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
	
	isJson(str: string): boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
	
}