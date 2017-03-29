import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
//import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { LoginComponent } from './login.component';
import { RegistrationComponent } from './registration.component';
import { UserFormComponent } from './user-form.component';
import { UserService } from './user.service';
import { CredentialsFormComponent } from './credentials-form.component';
import { CredentialsService } from './credentials.service';

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
		RegistrationComponent,
		UserFormComponent,
		CredentialsFormComponent
	],
	providers: [
		//{provide: LocationStrategy, useClass: HashLocationStrategy},
		UserService,
		CredentialsService
	],
	bootstrap: [
		AppComponent
	]
})

export class AppModule { }