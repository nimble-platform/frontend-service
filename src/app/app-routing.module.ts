import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './user-mgmt/login.component';
import { LogoutComponent } from './user-mgmt/logout.component';
import { RegistrationComponent } from './user-mgmt/registration.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CategorySearchComponent } from './catalogue/category/category-search.component';
import { ProductPublishComponent } from './catalogue/product-publish.component';
import { SimpleSearchComponent } from './simple-search/simple-search.component';
import { SimpleSearchDetailsComponent } from './simple-search/simple-search-details.component';
import { ExplorativeSearchComponent } from './explorative-search/explorative-search.component';
import {CatalogueViewComponent} from "./catalogue/catalogue-view.component";

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login',  component: LoginComponent },
  { path: 'logout',  component: LogoutComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'categorysearch', component: CategorySearchComponent },
  { path: 'publish', component: ProductPublishComponent },
  { path: 'simple-search', component: SimpleSearchComponent },
  { path: 'simple-search-details/:id', component: SimpleSearchDetailsComponent },
  { path: 'explore-search', component: ExplorativeSearchComponent },
  { path: 'catalogue', component: CatalogueViewComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { useHash: true })],
  exports: [ RouterModule ]
})

export class AppRoutingModule {}

