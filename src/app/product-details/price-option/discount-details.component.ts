import {Component, Input, OnInit} from '@angular/core';
import {PriceOption} from '../../catalogue/model/publish/price-option';
import {CatalogueLine} from '../../catalogue/model/publish/catalogue-line';
import { PRICE_OPTIONS } from '../../catalogue/model/constants';
import {Quantity} from '../../catalogue/model/publish/quantity';
import {PaymentMeans} from '../../catalogue/model/publish/payment-means';
import {Address} from '../../catalogue/model/publish/address';
import {Period} from '../../catalogue/model/publish/period';
import {CompanyNegotiationSettings} from '../../user-mgmt/model/company-negotiation-settings';

@Component({
    selector: "discount-details",
    templateUrl: "./discount-details.component.html"
})
export class DiscountDetailsComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() companyNegotiationSettings:CompanyNegotiationSettings;
    @Input() readonly:boolean = false;

    priceOptions = PRICE_OPTIONS;

    discountUnits = [];

    object = Object;

    ngOnInit() {
        this.updateDiscountUnits();
    }

    addPriceOption(priceOptionType: any): void {
        let priceOption: PriceOption = new PriceOption();

        priceOption.typeID = priceOptionType;

        if (priceOptionType == PRICE_OPTIONS.ORDERED_QUANTITY.typeID) {
            priceOption.itemLocationQuantity.minimumQuantity = new Quantity(this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.value, this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.unitCode);

        } else if(priceOptionType == PRICE_OPTIONS.PRODUCT_PROPERTY.typeID) {
            priceOption.additionalItemProperty = [];
        } else if(priceOptionType == PRICE_OPTIONS.INCOTERM.typeID){
            priceOption.incoterms = [];
        } else if(priceOptionType == PRICE_OPTIONS.PAYMENT_MEAN.typeID){
            priceOption.paymentMeans = [new PaymentMeans()];
        } else if(priceOptionType == PRICE_OPTIONS.DELIVERY_LOCATION.typeID){
            priceOption.itemLocationQuantity.applicableTerritoryAddress = [new Address()];
        } else if(priceOptionType == PRICE_OPTIONS.DELIVERY_PERIOD.typeID){
            priceOption.estimatedDeliveryPeriod = new Period();
        }

        this.catalogueLine.priceOption.push(priceOption);
        this.catalogueLine.priceOption = [].concat(this.catalogueLine.priceOption);
        // update discount unit list
        this.updateDiscountUnits();
    }

    removePriceOption(index: number): void {
        this.catalogueLine.priceOption.splice(index, 1);
        this.catalogueLine.priceOption = [].concat(this.catalogueLine.priceOption);
    }

    updateDiscountUnits(){
        this.discountUnits = [].concat([this.catalogueLine.requiredItemLocationQuantity.price.priceAmount.currencyID,"%"]);
    }

}
