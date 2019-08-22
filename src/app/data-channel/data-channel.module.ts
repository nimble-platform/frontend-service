import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DataChannelRoutingModule} from './data-channel-routing.module';
import {ChannelDetailsComponent} from "./channel-details.component";
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HttpClient} from '@angular/common/http';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';

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