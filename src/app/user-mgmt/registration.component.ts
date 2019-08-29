import { Component } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'nimble-registration',
	templateUrl: './registration.component.html'
})



export class RegistrationComponent {
	constructor(
		private translate: TranslateService
	) {
	}
}
