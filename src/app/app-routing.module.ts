import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './user-mgmt/login.component';
import { LogoutComponent } from './user-mgmt/logout.component';
import { RegistrationComponent } from './user-mgmt/registration.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CategorySearchComponent } from './catalogue/category/category-search.component'; 
import { HelloWorldComponent } from './search/search/complexsearch'; 
import { ProductPublishComponent } from "./catalogue/product-publish.component"; 


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login',  component: LoginComponent },
  { path: 'logout',  component: LogoutComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'categorysearch', component: CategorySearchComponent },
   { path: 'search', component: HelloWorldComponent },
  { path: 'publish', component: ProductPublishComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { useHash:true })],
  exports: [ RouterModule ]
})

export class AppRoutingModule {}