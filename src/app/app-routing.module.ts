import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
    {path: '', redirectTo: '/user-mgmt/login', pathMatch: 'full'},
	{path: 'user-mgmt', loadChildren:'app/user-mgmt/user-mgmt.module#UserMgmtModule'},
	{path: 'dashboard', loadChildren: 'app/dashboard/dashboard.module#DashboardModule'},
	{path: 'catalogue', loadChildren:'app/catalogue/catalogue.module#CatalogueModule'},
	{path: 'simple-search', loadChildren:'app/simple-search/simple-search.module#SimpleSearchModule'},
    {path: 'explore-search', loadChildren:'app/explorative-search/explorative-search.module#ExplorativeSearchModule'},
	{path: 'bpe', loadChildren: 'app/bpe/bpe.module#BPEModule'},
	{path: 'data-channel', loadChildren: 'app/data-channel/data-channel.module#DataChannelModule'},
	{path: 'product-details', loadChildren: 'app/product-details/product-details.module#ProductDetailsModule'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true})],
    exports: [RouterModule]
})

export class AppRoutingModule {
}
