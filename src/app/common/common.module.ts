/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CallStatusComponent } from "./call-status.component";
import { TextInputComponent } from './text-input.component';
import { OptionsInputComponent } from './options-input.component';
import { QuantityInputComponent } from './quantity-input.component';
import { PlainAmountInputComponent } from './plain-amount-input.component';
import { FileInputComponent } from './file-input.component';
import { DateInputComponent } from './date-input.component';
import { AddressInputComponent } from './address-input.component';
import { BooleanInputComponent } from './boolean-input.component';
import { MultiAddressInputComponent } from './multi-address-input.component';
import { InputLabelComponent } from './input-label.component';
import { AmountInputComponent } from "./amount-input.component";
import { ExpandableFlexRow } from "./expandable-flex-row.component";
import { MultiTypeInputComponent } from "./multi-type-input.component";
import { HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DisableControlDirective } from './disable-control-directive';
import { SingleClickDirective } from './single-click.directive';
import {ConfirmModalComponent} from './confirm-modal.component';
import {AmountUiTranslatePipe} from './pipe/amount-ui-translate.pipe';
import {QuantityTranslatePipe} from './pipe/quantity-translate.pipe';
import {WordByWordTranslatePipe} from './pipe/word-by-word-translate.pipe';
import {CancelCollaborationModalComponent} from './cancel-collaboration-modal.component';
import {CategoryFacetComponent} from './search/category-facet.component';
import {SearchFacetComponent} from './search/search-facet.component';

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        HttpModule,
        ReactiveFormsModule,
        NgbModule.forRoot(),
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            },
            isolate: false
        })
    ],
    declarations: [
        CallStatusComponent,
        TextInputComponent,
        OptionsInputComponent,
        QuantityInputComponent,
        PlainAmountInputComponent,
        FileInputComponent,
        DateInputComponent,
        ConfirmModalComponent,
        AddressInputComponent,
        AmountUiTranslatePipe,
        QuantityTranslatePipe,
        WordByWordTranslatePipe,
        BooleanInputComponent,
        MultiAddressInputComponent,
        InputLabelComponent,
        AmountInputComponent,
        ExpandableFlexRow,
        MultiTypeInputComponent,
        DisableControlDirective,
        CancelCollaborationModalComponent,
        SingleClickDirective,
        CategoryFacetComponent,
        SearchFacetComponent
    ],
    exports: [
        CallStatusComponent,
        TextInputComponent,
        OptionsInputComponent,
        QuantityInputComponent,
        PlainAmountInputComponent,
        FileInputComponent,
        DateInputComponent,
        AddressInputComponent,
        BooleanInputComponent,
        CancelCollaborationModalComponent,
        ConfirmModalComponent,
        MultiAddressInputComponent,
        InputLabelComponent,
        AmountInputComponent,
        ExpandableFlexRow,
        MultiTypeInputComponent,
        TranslateModule,
        AmountUiTranslatePipe,
        QuantityTranslatePipe,
        WordByWordTranslatePipe,
        SingleClickDirective,
        CategoryFacetComponent,
        SearchFacetComponent
    ],
    providers: [
    ]
})

export class AppCommonModule { }
