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

import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { CategorySearchComponent } from "./category/category-search.component";
import { ProductPublishComponent } from "./publish/product-publish.component";
import { CatalogueViewComponent } from "./ubl-model-view/catalogue/catalogue-view.component";
import { PublishDeactivateGuardService } from "./publish-deactivate-guard.service";
import { CategoryDeactivateGuardService } from "./category/category-deactivate-guard.service";
import { LogisticServicePublishComponent } from './publish/logistic-service-publish.component';
import { LogisticPublishDeactivateGuardService } from './logistic-publish-deactivate-guard.service';
import { AssetTypeRegistry } from './iasset-registry/type-registry.component';
import { AssetInstanceRegistry } from './iasset-registry/instance-registry.component';

const routes: Routes = [
    { path: "categorysearch", component: CategorySearchComponent, canDeactivate: [CategoryDeactivateGuardService] },
    { path: "publish", component: ProductPublishComponent, canDeactivate: [PublishDeactivateGuardService] },
    { path: "publish-logistic", component: LogisticServicePublishComponent, canDeactivate: [LogisticPublishDeactivateGuardService] },
    { path: "catalogue", component: CatalogueViewComponent },
    { path: "register-type", component: AssetTypeRegistry },
    { path: "register-instance", component: AssetInstanceRegistry }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CatalogueRoutingModule { }
