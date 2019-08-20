import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '../common/common.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ExplorativeSearchRoutingModule } from './explorative-search-routing.module';

import { ExplorativeSearchComponent } from './explorative-search.component';
import { ExplorativeSearchFormComponent } from './explorative-search-form.component';
import { ExplorativeSearchDetailsComponent } from './explorative-search-details.component';
import { ExplorativeSearchFilterComponent } from './explorative-search-filter.component';
import {ExplorativeSearchSemanticComponent} from './explorative-search-semantic.component';

// Translation
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        HttpClientModule,
        ExplorativeSearchRoutingModule,
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
        ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        ExplorativeSearchFilterComponent,
        ExplorativeSearchSemanticComponent
    ],
    exports: [
        ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        ExplorativeSearchFilterComponent,
        ExplorativeSearchSemanticComponent
    ],
    providers: [],
    entryComponents: []
})

export class ExplorativeSearchModule {}
