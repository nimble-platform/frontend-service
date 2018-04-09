import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {DashboardThreadedComponent} from "./dashboard-threaded.component";

const routes: Routes = [
	{ path: '', component: DashboardThreadedComponent}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class DashboardRoutingModule {}