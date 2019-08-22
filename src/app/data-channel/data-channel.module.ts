import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DataChannelRoutingModule} from './data-channel-routing.module';
import {ChannelDetailsComponent} from "./channel-details.component";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpModule,
        ReactiveFormsModule,
        DataChannelRoutingModule,
        NgbModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: HttpLoaderFactory,
              deps: [HttpClient]
            }
        })
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