import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '../common/common.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { QualiExploreRoutingModule } from './qualiexplore-routing.module'

import { QualiExploreComponent } from './qualiexplore.component';
import { FiltersComponent } from './filters/filters.component';
import { FactorsComponent } from './factors/factors.component';

// ngx-treeview Component
import { TreeviewModule } from 'ngx-treeview';

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
        HttpModule,
        QualiExploreRoutingModule,
        HttpClientModule,
        TreeviewModule.forRoot(),
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
        QualiExploreComponent,
        FiltersComponent,
        FactorsComponent
    ],
    exports: [
        QualiExploreComponent,
        FiltersComponent,
        FactorsComponent
    ],
    providers: [],
    entryComponents: []
})

export class QualiExploreModule {}
