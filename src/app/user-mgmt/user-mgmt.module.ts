import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UserMgmtRoutingModule } from './user-mgmt-routing.module';

import { LoginComponent } from './login.component';
import { LogoutComponent } from './logout.component';
import { ForgotPasswordComponent } from './forgot-password.component';
import { RegistrationComponent } from './registration.component';
import { UserFormComponent } from './user-form.component';
import { CredentialsFormComponent } from './credentials-form.component';
import { AddressSubForm } from './subforms/address.component';
import { DeliveryTermsSubForm } from './subforms/delivery-terms.component';
import { CompanyRegistrationComponent } from './company-registration.component';
import { CompanyInvitationComponent } from './company-invitation.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { CompanyDescriptionSettingsComponent } from './company-settings/company-description-settings.component';
import { CompanyNegotiationSettingsComponent } from './company-settings/company-negotiation-settings.component';
import { CompanyCertificatesSettingsComponent } from './company-settings/company-certificates-settings.component';
import { CompanyDataSettingsComponent } from './company-settings/company-data-settings.component';
import { CompanyDeliveryTermsComponent } from './company-settings/company-delivery-terms.component';
import { CompanyCategoriesSettingsComponent } from './company-settings/company-categories-settings.component';
import { CompanyDetailsComponent } from './company-details.component';
import { CompanyRatingComponent } from './company-rating.component';
import { UserProfileComponent } from './user-profile.component';

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
        CompanySettingsComponent,
		CompanyDescriptionSettingsComponent,
		CompanyRegistrationComponent,
		CompanyInvitationComponent,
		CompanyNegotiationSettingsComponent,
		CompanyCertificatesSettingsComponent,
		CompanyDataSettingsComponent,
		CompanyDeliveryTermsComponent,
		CompanyCategoriesSettingsComponent,
		CompanyDetailsComponent,
		CompanyRatingComponent,
		UserProfileComponent,
		ForgotPasswordComponent
	],
	exports: [
		LoginComponent,
        LogoutComponent,
		RegistrationComponent,
		UserFormComponent,
		CredentialsFormComponent,
		AddressSubForm,
        DeliveryTermsSubForm,
		CompanyRegistrationComponent,
		CompanyInvitationComponent,
		CompanyDetailsComponent,
		CompanyRatingComponent,
		UserProfileComponent,
		ForgotPasswordComponent
	],
	providers: [
	]
})

export class UserMgmtModule {}
