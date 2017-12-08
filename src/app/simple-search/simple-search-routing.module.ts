import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {SimpleSearchComponent} from './simple-search.component';
import {SimpleSearchDetailsComponent} from './simple-search-details.component';

const routes: Routes = [
	{path: '', component: SimpleSearchComponent},
    {path: 'details', component: SimpleSearchDetailsComponent}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class SimpleSearchRoutingModule {}