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
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '../common/common.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { QualiExploreRoutingModule } from './qualiexplore-routing.module'

import { QualiExploreComponent } from './qualiexplore.component';
import { FiltersComponent } from './filters/filters.component';
import { FactorsComponent } from './factors/factors.component';

// ngx-treeview Component
import { TreeviewModule } from 'ngx-treeview';

import { HttpClientModule } from '@angular/common/http';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpModule,
        QualiExploreRoutingModule,
        HttpClientModule,
        TreeviewModule.forRoot(),
        NgbModule.forRoot()
    ],
    declarations: [
        QualiExploreComponent,
        FiltersComponent,
        FactorsComponent
    ],
    exports: [
        QualiExploreComponent,
        FiltersComponent,
        FactorsComponent
    ],
    providers: [],
    entryComponents: []
})

export class QualiExploreModule {}
