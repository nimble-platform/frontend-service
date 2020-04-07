import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LegislationLoginComponent } from './login/legislation-login.component';
import { LegislationSearchComponent } from './search/legislation-search.component';
import { LegislationDetailsComponent } from './details/legislation-details.component';

const routes: Routes = [
	/*{path: '', redirectTo: 'login', pathMatch: 'full'},*/
	{path: '', redirectTo: 'search', pathMatch: 'full'},
	{path: 'login', component: LegislationLoginComponent},
	{path: 'search', component: LegislationSearchComponent},
	{path: 'details/:docType/:docId', component: LegislationDetailsComponent}
];

@NgModule({
    imports: [ RouterModule.forChild(routes) ],
    exports: [ RouterModule ],
    providers: []
})

export class LegislationRoutingModule {}
