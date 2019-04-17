import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { CategorySearchComponent } from "./category/category-search.component";
import { ProductPublishComponent } from "./publish/product-publish.component";
import { CatalogueViewComponent } from "./ubl-model-view/catalogue/catalogue-view.component";
import { PublishDeactivateGuardService } from "./publish-deactivate-guard.service";
import { CategoryDeactivateGuardService } from "./category/category-deactivate-guard.service";
import {LogisticServicePublishComponent} from './publish/logistic-service-publish.component';
import {LogisticPublishDeactivateGuardService} from './logistic-publish-deactivate-guard.service';

const routes: Routes = [
    { path: "categorysearch", component: CategorySearchComponent, canDeactivate: [CategoryDeactivateGuardService] },
    { path: "publish", component: ProductPublishComponent, canDeactivate: [PublishDeactivateGuardService] },
    { path: "publish-logistic", component: LogisticServicePublishComponent, canDeactivate: [LogisticPublishDeactivateGuardService]},
    { path: "catalogue", component: CatalogueViewComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CatalogueRoutingModule {}
