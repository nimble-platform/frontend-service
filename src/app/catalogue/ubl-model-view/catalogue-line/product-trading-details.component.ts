import { Component, Input } from "@angular/core";
import { CatalogueLine } from "../../model/publish/catalogue-line";
import { FormGroup } from "@angular/forms";
import { INCOTERMS } from "../../model/constants";

@Component({
    selector: 'product-trading-details',
    templateUrl: './product-trading-details.component.html',
})

// Component that displays warranty information etc. inside the "trading details" tab in CatalogueLineView
export class ProductTradingDetailsComponent {
    @Input() presentationMode:string;
    @Input() catalogueLine: CatalogueLine;
    @Input() parentForm: FormGroup;

    INCOTERMS: string[] = INCOTERMS;
}
