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

const routes: Routes = [
    { path: "login", component: LoginComponent },
    { path: "logout", component: LogoutComponent },
    { path: "registration", component: RegistrationComponent },
    { path: "company-registration", component: CompanyRegistrationComponent },
    { path: "company-invitation", component: CompanyInvitationComponent },
    { path: "company-settings", component: CompanySettingsComponent },
    { path: "company-details", component: CompanyDetailsComponent },
    { path: "company-rating", component: CompanyRatingComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserMgmtRoutingModule {}
