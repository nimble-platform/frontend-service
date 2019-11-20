import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '../common/common.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TnTRoutingModule } from './tnt-routing.module';

import { TnTComponent } from './tnt.component';
import { TnTFormComponent } from './tnt-form.component';
import { TnTEventDataComponent } from './tnt-event-data.component';
import { TnTEventDetailsComponent } from './tnt-event-details.component';
import { SafePipe } from './model/SafePipe';

import { HttpClientModule } from '@angular/common/http';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        HttpModule,
        TnTRoutingModule,
        NgbModule.forRoot()
    ],
    declarations: [
        SafePipe,
        TnTComponent,
        TnTFormComponent,
        TnTEventDataComponent,
        TnTEventDetailsComponent
    ],
    exports: [
        TnTComponent,
        TnTFormComponent,
        TnTEventDataComponent,
        TnTEventDetailsComponent
    ],
    providers: [],
    entryComponents: []
})

export class TnTModule {}
