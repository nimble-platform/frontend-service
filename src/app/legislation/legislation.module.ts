import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from "../common/common.module";

import { NgbdSortableHeader } from './sortable.directive';
import { LegislationRoutingModule } from './legislation-routing.module'
import { LegislationComponent } from './legislation.component';
import { LegislationLoginComponent } from './login/legislation-login.component';
import { LegislationSearchComponent } from './search/legislation-search.component';
import { LegislationDetailsComponent } from './details/legislation-details.component';

@NgModule({
    imports: [
		CommonModule,
        AppCommonModule,
		LegislationRoutingModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		NgbModule.forRoot()
    ],
    declarations: [
        LegislationComponent,
		LegislationLoginComponent,
        LegislationSearchComponent,
        LegislationDetailsComponent,
		NgbdSortableHeader
    ],
    exports: [
        LegislationComponent,
		LegislationLoginComponent,
        LegislationSearchComponent,
        LegislationDetailsComponent,
		NgbdSortableHeader
    ],
    providers: [],
    entryComponents: []
})

export class LegislationModule {}
