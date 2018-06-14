import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '../common/common.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TrackingRoutingModule } from './tracking-routing.module';

import { TrackingComponent } from './tracking.component';
import { TrackingFormComponent } from './tracking-form.component';
import {NgxGraphModule} from '@swimlane/ngx-graph';
import {NgxChartsModule} from '@swimlane/ngx-charts';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        TrackingRoutingModule,
        NgxGraphModule,
        NgxChartsModule,
        NgbModule.forRoot()
    ],
    declarations: [
      TrackingComponent,
      TrackingFormComponent
    ],
    exports: [
        TrackingComponent,
        TrackingFormComponent
    ],
    providers: [],
    entryComponents: []
})

export class TrackingModule {}
