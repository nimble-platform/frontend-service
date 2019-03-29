import { Component, OnInit,Input } from '@angular/core';
import { AppComponent } from '../app.component';
import { CompanyInvitation } from './model/company-invitation';
import { UserService } from './user.service';
import { CookieService } from 'ng2-cookies';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as myGlobals from '../globals';
import { CallStatus } from '../common/call-status';
import { copy } from '../common/utils';

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
	tooltipHTML = "";
	userRoles = [];
  config = myGlobals.config;
	rolesSelected = false;
	rolesChangeSelected = true;

	rolesCallStatus: CallStatus = new CallStatus();
	submitCallStatus: CallStatus = new CallStatus();
	membersCallStatus: CallStatus = new CallStatus();
	membersFetched: boolean = false;
	@Input() partyId : string = null;
	@Input() platformManagerMode: boolean = false;

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
		if(this.partyId && this.partyId != this.cookieService.get("company_id"))
			this.platformManagerMode = true;
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
		this.membersCallStatus.submit();
		this.membersFetched = false;
    if (this.partyId == "")
      this.partyId = null;
		this.userService.getCompanyMemberList(this.partyId)
            .then(response => {
                this.invPending = response;
				this.membersCallStatus.callback("Successfully loading invites", true);
				this.membersFetched = true;
            })
			.catch(error => {
				this.invPending = [];
				this.membersCallStatus.error("Error while loading invites", error);
            });
	}

	loadRoles() {
		this.userRoles = [];
		this.rolesCallStatus.submit();
		this.userService.getUserRoles()
      .then(response => {
				response.sort(function(a,b){
					var a_comp = a.name;
					var b_comp = b.name;
					return a_comp.localeCompare(b_comp);
				});
        for (var role of response) {
          if (this.config.supportedRoles.indexOf(role.identifier) != -1)
            this.userRoles.push(role);
        }
				this.rolesCallStatus.callback("Successfully fetched roles.", true);
      })
			.catch(error => {
				this.userRoles = [];
				this.rolesCallStatus.error("Error while fetching roles.", error);
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
			this.invToChange = copy(inv);
		}
	}

	openModal(content) {
		this.modalService.open(content);
	}

  cancelInvite(inv) {
		if (confirm("Are you sure that you want to cancel the invitation for this user?")) {
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

	showRoleTT(content) {
		var tooltip = "";
		tooltip += "<table class='table table-striped table-bordered'>";
		tooltip += "<tr><th>Role</th><th>Permissions</th></tr>";
    if (this.config.supportedRoles.indexOf("company_admin") != -1)
		  tooltip += "<tr><td>Company Admin</td><td>A member of the company that got all rights on the NIMBLE platform (except for assigning external/legal representatives)</td></tr>";
    if (this.config.supportedRoles.indexOf("external_representative") != -1)
      tooltip += "<tr><td>External Representative</td><td>Somebody from outside the company that got all rights connected to the company on the NIMBLE platform (except for assigning external/legal representatives)</td></tr>";
    tooltip += "<tr><td>Legal Representative</td><td>The legally liable representative of your company. Usually a single person. Has got all rights on the NIMBLE platform</td></tr>";
    if (this.config.supportedRoles.indexOf("monitor") != -1)
      tooltip += "<tr><td>Monitor</td><td>Can observe sales, purchases and relevant business data on the NIMBLE platform without executing the associated business processes</td></tr>";
    if (this.config.supportedRoles.indexOf("publisher") != -1)
      tooltip += "<tr><td>Publisher</td><td>Can publish and maintain the catalogues of the company</td></tr>";
    if (this.config.supportedRoles.indexOf("purchaser") != -1)
      tooltip += "<tr><td>Purchaser</td><td>Can observe purchases on the NIMBLE platform and execute the associated business processes</td></tr>";
    if (this.config.supportedRoles.indexOf("sales_officer") != -1)
		  tooltip += "<tr><td>Sales Offices</td><td>Can observe sales on the NIMBLE platform and execute the associated business processes</td></tr>";
		this.tooltipHTML = tooltip;
		this.modalService.open(content);
	}

	onSubmit() {
		let companyId = this.cookieService.get('company_id');
		let companyInvitation: CompanyInvitation = new CompanyInvitation(companyId, this.invEmail, this.invRoles);
		if (myGlobals.debug)
			console.log(`Sending invitation ${JSON.stringify(companyInvitation)}`);
		this.submitCallStatus.submit();
		this.userService.inviteCompany(companyInvitation)
            .then(response => {
                this.submitCallStatus.callback("Invitation sent");
				this.loadInvites();
            })
			.catch(error => {
				this.submitCallStatus.error(
					error.status === 400 ? "User already invited" : "Error while inviting user",
					error
				);
            });
    }

	private isJson(str: string): boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

}
