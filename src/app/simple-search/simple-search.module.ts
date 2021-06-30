/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SimpleSearchRoutingModule } from './simple-search-routing.module';

// ToDo: Get rid of these dependencies
import { CatalogueModule } from '../catalogue/catalogue.module';
import { BPEModule } from '../bpe/bpe.module';

import { SimpleSearchComponent } from './simple-search.component';
import { SimpleSearchFormComponent } from './simple-search-form.component';
import { SearchNavigationGuardService } from './search-navigation-guard.service';
import {SearchMapComponent} from './search-map.component';
import {FilterSearchInputComponent} from './filter-search-input.component';

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
        SimpleSearchFormComponent,
        SearchMapComponent,
        FilterSearchInputComponent,
    ],
    exports: [
        SimpleSearchComponent,
        SimpleSearchFormComponent
    ],
    providers: [
        SearchNavigationGuardService
    ]
})

export class SimpleSearchModule { }
