/**
 * Copyright 2020
 * University of Bremen, Faculty of Production Engineering, Badgasteiner Straße 1, 28359 Bremen, Germany.
 * In collaboration with BIBA - Bremer Institut für Produktion und Logistik GmbH, Bremen, Germany.
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
import { AppCommonModule } from '../common/common.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ExplorativeSearchRoutingModule } from './explorative-search-routing.module';

import { ExplorativeSearchComponent } from './explorative-search.component';
import { ExplorativeSearchFormComponent } from './explorative-search-form.component';
import { ExplorativeSearchDetailsComponent } from './explorative-search-details.component';
import { ExplorativeSearchFilterComponent } from './explorative-search-filter.component';
import {ExplorativeSearchSemanticComponent} from './explorative-search-semantic.component';

import { HttpClientModule } from '@angular/common/http';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        HttpClientModule,
        ExplorativeSearchRoutingModule,
        NgbModule.forRoot()
    ],
    declarations: [
        ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        ExplorativeSearchFilterComponent,
        ExplorativeSearchSemanticComponent
    ],
    exports: [
        ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        ExplorativeSearchFilterComponent,
        ExplorativeSearchSemanticComponent
    ],
    providers: [],
    entryComponents: []
})

export class ExplorativeSearchModule {}
