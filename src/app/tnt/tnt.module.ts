import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '../common/common.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TnTRoutingModule } from './tnt-routing.module';

import { TnTComponent } from './tnt.component';
import { TnTFormComponent } from './tnt-form.component';

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
      TnTComponent,
      TnTFormComponent
    ],
    exports: [
        TnTComponent,
        TnTFormComponent
    ],
    providers: [],
    entryComponents: []
})

export class TnTModule {}
