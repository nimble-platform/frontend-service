import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CallStatusComponent } from "./call-status.component";
import { ValueInputComponent } from './value-input.component';
import { ActionsRowComponent } from './actions-row.component';

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
		ValueInputComponent,
		ActionsRowComponent
	],
	exports: [
		CallStatusComponent,
		ValueInputComponent,
		ActionsRowComponent
	],
	providers: [
	]
})

export class AppCommonModule {}