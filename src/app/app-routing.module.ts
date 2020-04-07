/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
 * AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors; Valencia; Spain
 * UB - University of Bremen, Faculty of Production Engineering; Bremen; Germany
 * BIBA - Bremer Institut für Produktion und Logistik GmbH; Bremen; Germany
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
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {path: '', redirectTo: '/user-mgmt/login', pathMatch: 'full'},
	{path: 'user-mgmt', loadChildren:'./user-mgmt/user-mgmt.module#UserMgmtModule'},
	{path: 'dashboard', loadChildren: './dashboard/dashboard.module#DashboardModule'},
	{path: 'catalogue', loadChildren:'./catalogue/catalogue.module#CatalogueModule'},
	{path: 'simple-search', loadChildren:'./simple-search/simple-search.module#SimpleSearchModule'},
    {path: 'explore-search', loadChildren:'./explorative-search/explorative-search.module#ExplorativeSearchModule'},
	{path: 'bpe', loadChildren: './bpe/bpe.module#BPEModule'},
	{path: 'data-channel', loadChildren: './data-channel/data-channel.module#DataChannelModule'},
	{path: 'tnt', loadChildren: './tnt/tnt.module#TnTModule'},
	{path: 'product-details', loadChildren: './product-details/product-details.module#ProductDetailsModule'},
	{path: 'analytics', loadChildren: './analytics/analytics.module#AnalyticsModule'},
	{path: 'qualiexplore', loadChildren: './qualiexplore/qualiexplore.module#QualiExploreModule'},
  {path: 'legislation', loadChildren: './legislation/legislation.module#LegislationModule'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true})],
    exports: [RouterModule]
})

export class AppRoutingModule {}
