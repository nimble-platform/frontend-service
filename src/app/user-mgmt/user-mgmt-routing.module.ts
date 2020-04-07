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

import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { LoginComponent } from "./login.component";
import { LogoutComponent } from "./logout.component";
import { RegistrationComponent } from "./registration.component";
import { CompanyRegistrationComponent } from "./company-registration.component";
import { CompanyInvitationComponent } from "./company-invitation.component";
import { CompanySettingsComponent } from "./company-settings/company-settings.component";
import { CompanyDetailsComponent } from "./company-details.component";
import { CompanyRatingComponent } from './company-rating.component';
import { UserProfileComponent } from './user-profile.component';
import { AgentsComponent } from './agents.component';
import {ForgotPasswordComponent} from "./forgot-password.component";
import {CompanyTermsAndConditions} from './company-settings/company-terms-and-conditions';

const routes: Routes = [
    { path: "login", component: LoginComponent },
    { path: "logout", component: LogoutComponent },
    { path: "forgot", component: ForgotPasswordComponent },
    { path: "registration", component: RegistrationComponent },
    { path: "company-registration", component: CompanyRegistrationComponent },
    { path: "company-invitation", component: CompanyInvitationComponent },
    { path: "company-settings", component: CompanySettingsComponent },
    { path: "company-details", component: CompanyDetailsComponent },
    { path: "company-rating", component: CompanyRatingComponent },
    { path: "company-terms-and-conditions", component: CompanyTermsAndConditions},
    { path: "user-profile", component: UserProfileComponent },
    { path: "agents", component: AgentsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserMgmtRoutingModule {}
