import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DataChannelRoutingModule} from './data-channel-routing.module';
import {ChannelDetailsComponent} from "./channel-details.component";

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpModule,
        ReactiveFormsModule,
        DataChannelRoutingModule,
        NgbModule.forRoot()
    ],
    declarations: [
        ChannelDetailsComponent
    ],
    exports: [
        ChannelDetailsComponent
    ],
    providers: []
})

export class DataChannelModule {
}