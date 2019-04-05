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
import { AddressInputSimpleComponent } from './address-input-simple.component';
import { BooleanInputComponent } from './boolean-input.component';
import { MultiAddressInputComponent } from './multi-address-input.component';
import { InputLabelComponent } from './input-label.component';
import {AmountInputComponent} from "./amount-input.component";
import {ExpandableFlexRow} from "./expandable-flex-row.component";

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
		PlainAmountInputComponent,
		FileInputComponent,
		DateInputComponent,
		AddressInputComponent,
		AddressInputSimpleComponent,
		BooleanInputComponent,
		MultiAddressInputComponent,
		InputLabelComponent,
		AmountInputComponent,
		ExpandableFlexRow
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
		AddressInputSimpleComponent,
		BooleanInputComponent,
		MultiAddressInputComponent,
		InputLabelComponent,
		AmountInputComponent,
		ExpandableFlexRow
	],
	providers: [
	]
})

export class AppCommonModule {}
