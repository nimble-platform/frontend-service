import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { LogoutComponent } from './logout.component';
import { RegistrationComponent } from './registration.component';
import { DashboardComponent } from './dashboard.component';
import {CategorySearchComponent} from './catalogue/category/category-search.component';
import {ProductPublishComponent} from "./catalogue/product-publish.component";

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login',  component: LoginComponent },
  { path: 'logout',  component: LogoutComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'categorysearch', component: CategorySearchComponent},
  {path: 'publish', component: ProductPublishComponent}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { useHash:true })],
  exports: [ RouterModule ]
})

export class AppRoutingModule {}