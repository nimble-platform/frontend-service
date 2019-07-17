import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {BPsComponent} from './bps.component';
import {BPDetailComponent} from './bp-detail.component';
import {BPConfigureComponent} from './bp-configure.component';
import {ProductBpOptionsComponent} from "./bp-view/product-bp-options.component";
import {FrameContractDetailsComponent} from "./bp-view/contract/frame-contract-details.component";
import {ThreadSummaryComponent} from "./bp-summary/thread-summary.component";

const routes: Routes = [
	{path: 'bpe-design/detail/:processID', component: BPDetailComponent},
    {path: 'bpe-design/create', component: BPDetailComponent},
    {path: 'bpe-design', component: BPsComponent},
    {path: 'bpe-design/configure/:processID', component: BPConfigureComponent},
    {path: 'bpe-exec', component: ProductBpOptionsComponent},
    {path: 'bpe-exec/:processInstanceId', component: ThreadSummaryComponent},
    {path: 'frame-contract/:id', component: FrameContractDetailsComponent}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class BPERoutingModule {}