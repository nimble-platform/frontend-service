import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FiltersComponent } from './filters/filters.component';
import { FactorsComponent } from './factors/factors.component';

const routes: Routes = [
    {path: '', redirectTo: 'filters', pathMatch: 'full'},
    {path: 'filters', component: FiltersComponent},
    {path: 'factors', component: FactorsComponent}
];

@NgModule({
    imports: [ RouterModule.forChild(routes) ],
    exports: [ RouterModule ],
    providers: []
})

export class QualiExploreRoutingModule {}

