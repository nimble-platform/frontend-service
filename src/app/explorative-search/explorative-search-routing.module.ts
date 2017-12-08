import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {ExplorativeSearchComponent} from './explorative-search.component';

const routes: Routes = [
	{path: '', component: ExplorativeSearchComponent}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class ExplorativeSearchRoutingModule {}