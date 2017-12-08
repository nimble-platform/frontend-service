import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SimpleSearchRoutingModule } from './simple-search-routing.module';

// ToDo: Get rid of these dependencies
import { CatalogueModule } from '../catalogue/catalogue.module';
import { BPEModule } from '../bpe/bpe.module';

import { SimpleSearchComponent } from './simple-search.component';
import { SimpleSearchDetailsComponent } from './simple-search-details.component';
import { SimpleSearchFormComponent } from './simple-search-form.component';
import { SimpleSearchService } from './simple-search.service';
import { SearchContextService } from "./search-context.service";

@NgModule({
	imports: [
		CommonModule,
		AppCommonModule,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
		SimpleSearchRoutingModule,
		CatalogueModule,
		BPEModule,
		NgbModule.forRoot()
	],
	declarations: [
		SimpleSearchComponent,
		SimpleSearchDetailsComponent,
		SimpleSearchFormComponent
	],
	exports: [
		SimpleSearchComponent,
		SimpleSearchDetailsComponent,
		SimpleSearchFormComponent
	],
	providers: [
		SimpleSearchService,
		SearchContextService
	]
})

export class SimpleSearchModule {}