import {Component, Input} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {FormGroup} from "@angular/forms";
import {Address} from "../../model/publish/address";
import {UBLModelUtils} from "../../model/ubl-model-utils";

@Component({
    selector: 'product-trading-details',
    templateUrl: './product-trading-details.component.html',
})

// Component that displays warranty information etc. inside the "trading details" tab in CatalogueLineView
export class ProductTradingDetailsComponent {
    @Input() presentationMode:string;
    @Input() catalogueLine: CatalogueLine;
    @Input() parentForm: FormGroup;

    addInitialCountry(value: string): void {
        let address:Address = UBLModelUtils.createAddress();
        address.country.name = value;
        this.catalogueLine.requiredItemLocationQuantity.applicableTerritoryAddress = [address];
        console.log("address added: " + value);
    }
}
