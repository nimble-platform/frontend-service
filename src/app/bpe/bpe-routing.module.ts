/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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
import { Routes, RouterModule } from '@angular/router';

import { BPsComponent } from './bps.component';
import { BPDetailComponent } from './bp-detail.component';
import { BPConfigureComponent } from './bp-configure.component';
import { ProductBpOptionsComponent } from "./bp-view/product-bp-options.component";
import { FrameContractDetailsComponent } from "./bp-view/contract/frame-contract-details.component";
import { ThreadSummaryComponent } from "./bp-summary/thread-summary.component";
import { ShoppingCartComponent } from './shopping-cart/shopping-cart.component';

const routes: Routes = [
    { path: 'bpe-design/detail/:processID', component: BPDetailComponent },
    { path: 'bpe-design/create', component: BPDetailComponent },
    { path: 'bpe-design', component: BPsComponent },
    { path: 'bpe-design/configure/:processID', component: BPConfigureComponent },
    { path: 'bpe-exec/:processInstanceId/:delegateId', component: ProductBpOptionsComponent },
    { path: 'bpe-sum/:processInstanceId/:delegateId', component: ThreadSummaryComponent },
    { path: 'frame-contract/:id/:delegateId', component: FrameContractDetailsComponent },
    { path: 'shopping-cart', component: ShoppingCartComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class BPERoutingModule { }
