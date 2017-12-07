import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ExplorativeSearchRoutingModule } from './explorative-search-routing.module';

import { ExplorativeSearchComponent } from './explorative-search.component';
import { ExplorativeSearchService } from './explorative-search.service';
import { ExplorativeSearchFormComponent } from './explorative-search-form.component';
import { ExplorativeSearchDetailsComponent } from './explorative-search-details.component';
import { ExplorativeSearchFilterComponent } from './explorative-search-filter.component';

@NgModule({
	imports: [
		CommonModule,
		AppCommonModule,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
		ExplorativeSearchRoutingModule,
		NgbModule.forRoot()
	],
	declarations: [
		ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        ExplorativeSearchFilterComponent
	],
	exports: [
		ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        ExplorativeSearchFilterComponent
	],
	providers: [
		ExplorativeSearchService
	]
})

export class ExplorativeSearchModule {}