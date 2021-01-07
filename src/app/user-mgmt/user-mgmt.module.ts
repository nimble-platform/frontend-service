/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

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
import { AgentsComponent } from './agents.component';
import { CompanyTermsAndConditions } from './company-settings/company-terms-and-conditions';
import { EditTradingTermModalComponent } from './company-settings/edit-trading-term-modal.component';
import {CompanyNetworkSettingsComponent} from './company-settings/company-network-settings.component';
import {CompanyPaymentSettingsComponent} from './company-settings/company-payment-settings.component';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        UserMgmtRoutingModule,
        NgbModule.forRoot(),
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
        CompanyTermsAndConditions,
        CompanyNetworkSettingsComponent,
        EditTradingTermModalComponent,
        CompanyDetailsComponent,
        CompanyRatingComponent,
        UserProfileComponent,
        ForgotPasswordComponent,
        AgentsComponent,
        CompanyPaymentSettingsComponent
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
        ForgotPasswordComponent,
        AgentsComponent,
        CompanyTermsAndConditions
    ],
    providers: [
    ]
})

export class UserMgmtModule { }
