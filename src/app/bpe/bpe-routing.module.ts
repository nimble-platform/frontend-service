import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {BPsComponent} from './bps.component';
import {BPDetailComponent} from './bp-detail.component';
import {BPConfigureComponent} from './bp-configure.component';
import {ProductBpOptionsComponent} from "./bp-view/product-bp-options.component";

const routes: Routes = [
	{path: 'bpe-design/detail/:processID', component: BPDetailComponent},
    {path: 'bpe-design/create', component: BPDetailComponent},
    {path: 'bpe-design', component: BPsComponent},
    {path: 'bpe-design/configure/:processID', component: BPConfigureComponent},
    {path: 'bpe-exec', component: ProductBpOptionsComponent}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class BPERoutingModule {}