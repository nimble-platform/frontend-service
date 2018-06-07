import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ChannelDetailsComponent} from "./channel-details.component";

const routes: Routes = [
	{path: 'details/:channelID', component: ChannelDetailsComponent},
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class DataChannelRoutingModule {}