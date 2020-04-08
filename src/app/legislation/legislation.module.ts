/*
 * Copyright 2020
 * AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors; Valencia; Spain
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

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

export class LegislationModule { }
