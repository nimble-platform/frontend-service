import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CallStatusComponent } from "./call-status.component";
import { ActionsRowComponent } from './actions-row.component';
import { TextInputComponent } from './text-input.component';
import { OptionsInputComponent } from './options-input.component';
import { QuantityInputComponent } from './quantity-input.component';
import { AmountInputComponent } from './amount-input.component';
import { FileInputComponent } from './file-input.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		HttpModule,
		ReactiveFormsModule,
		NgbModule.forRoot()
	],
	declarations: [
		CallStatusComponent,
		TextInputComponent,
		OptionsInputComponent,
		QuantityInputComponent,
		AmountInputComponent,
		FileInputComponent,
		ActionsRowComponent
	],
	exports: [
		CallStatusComponent,
		TextInputComponent,
		OptionsInputComponent,
		QuantityInputComponent,
		AmountInputComponent,
		FileInputComponent,
		ActionsRowComponent
	],
	providers: [
	]
})

export class AppCommonModule {}