import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { LoginComponent } from './login.component';
import { LogoutComponent } from './logout.component';
import { RegistrationComponent } from './registration.component';
import { DashboardComponent } from './dashboard.component';
import { UserFormComponent } from './user-form.component';
import { UserService } from './user.service';
import { CredentialsFormComponent } from './credentials-form.component';
import { CredentialsService } from './credentials.service';
import {CategorySearchComponent} from "./catalogue/category/category-search.component";
import {CategoryService} from "./catalogue/category/category.service";
import {ProductPublishComponent} from "./catalogue/product-publish.component";
import {AdditionalItemPropertyComponent} from "./catalogue/additional-item-property.component";

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		HttpModule,
		AppRoutingModule,
		NgbModule.forRoot()
	],
	declarations: [
		AppComponent,
		LoginComponent,
		LogoutComponent,
		RegistrationComponent,
		DashboardComponent,
		UserFormComponent,
		CredentialsFormComponent,
		CategorySearchComponent,
		ProductPublishComponent,
		AdditionalItemPropertyComponent
	],
	providers: [
		UserService,
		CredentialsService,
		CategoryService
	],
	bootstrap: [
		AppComponent
	]
})

export class AppModule { }