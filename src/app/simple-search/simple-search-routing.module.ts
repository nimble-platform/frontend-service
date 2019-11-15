import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {SimpleSearchComponent} from './simple-search.component';
import {SearchNavigationGuardService} from './search-navigation-guard.service';

const routes: Routes = [
	{path: '', component: SimpleSearchComponent, canDeactivate: [SearchNavigationGuardService] }
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class SimpleSearchRoutingModule {}