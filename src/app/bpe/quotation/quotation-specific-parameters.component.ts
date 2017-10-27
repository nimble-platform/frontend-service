import {Component, Input} from "@angular/core";
import {Quotation} from "../model/ubl/quotation";

@Component({
    selector: 'quotation-specific-parameters',
    templateUrl: './quotation-specific-parameters.component.html'
})

export class QuotationSpecificParametersComponent {

	@Input() quotation:Quotation;
}