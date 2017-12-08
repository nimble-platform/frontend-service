import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UserMgmtRoutingModule } from './user-mgmt-routing.module';

import { LoginComponent } from './login.component';
import { LogoutComponent } from './logout.component';
import { RegistrationComponent } from './registration.component';
import { UserFormComponent } from './user-form.component';
import { UserService } from './user.service';
import { CredentialsFormComponent } from './credentials-form.component';
import { CredentialsService } from './credentials.service';
import { AddressSubForm } from './subforms/address.component';
import { DeliveryTermsSubForm } from './subforms/delivery-terms.component';
import { PaymentMeansForm } from './subforms/payment-means.component';
import { CompanySettingsComponent } from './company-settings.component';
import { CompanyRegistrationComponent } from './company-registration.component';
import { CompanyInvitationComponent } from './company-invitation.component';

@NgModule({
	imports: [
		CommonModule,
		AppCommonModule,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
		UserMgmtRoutingModule,
		NgbModule.forRoot()
	],
	declarations: [
		LoginComponent,
        LogoutComponent,
		RegistrationComponent,
		UserFormComponent,
		CredentialsFormComponent,
		AddressSubForm,
        DeliveryTermsSubForm,
        PaymentMeansForm,
        CompanySettingsComponent,
		CompanyRegistrationComponent,
		CompanyInvitationComponent
	],
	exports: [
		LoginComponent,
        LogoutComponent,
		RegistrationComponent,
		UserFormComponent,
		CredentialsFormComponent,
		AddressSubForm,
        DeliveryTermsSubForm,
        PaymentMeansForm,
        CompanySettingsComponent,
		CompanyRegistrationComponent,
		CompanyInvitationComponent
	],
	providers: [
		UserService,
        CredentialsService
	]
})

export class UserMgmtModule {}