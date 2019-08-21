import {Component, EventEmitter, Input, Output} from "@angular/core";
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'quantity-value-view',
    templateUrl: './quantity-value-view.component.html'
})
export class QuantityValueViewComponent {
    @Input() propName: string;
    @Input() value: number;
    @Input() unitType: string;
    @Input() unit: string;
    @Input() definition: string;

    @Output() onValueChanged: EventEmitter<number> = new EventEmitter<number>();

    constructor(
        private translate: TranslateService
    ) {
        translate.setDefaultLang("en");
        translate.use(translate.getBrowserLang());
    }

    ngOnChanges(values) {
        // emit the new value of the "value" field
        if(values['value'] != null) {
            this.onValueChanged.emit(values['value'].currentValue);
        }
    }
}
