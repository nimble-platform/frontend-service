import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {CategorySearchComponent} from './category/category-search.component';
import {ProductPublishComponent} from './product-publish.component';
import {CatalogueViewComponent} from './ubl-model-view/catalogue/catalogue-view.component';

const routes: Routes = [
	{path: 'categorysearch', component: CategorySearchComponent},
    {path: 'publish', component: ProductPublishComponent},
	{path: 'catalogue', component: CatalogueViewComponent},
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class CatalogueRoutingModule {}