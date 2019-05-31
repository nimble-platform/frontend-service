import {Component, OnInit, Input} from "@angular/core";
import {CatalogueLine} from "../model/publish/catalogue-line";
import {CURRENCIES,PRICE_OPTIONS} from "../model/constants";
import {PriceOptionCountPipe} from "./price-option/price-option-count.pipe";
import {PriceOption} from "../model/publish/price-option";
import {Quantity} from "../model/publish/quantity";
import {PriceOptionPipe} from "./price-option/price-option.pipe";
import {Period} from '../model/publish/period';
import {Address} from '../model/publish/address';
import {CompanyNegotiationSettings} from '../../user-mgmt/model/company-negotiation-settings';
import {PaymentMeans} from '../model/publish/payment-means';
import {CatalogueService} from "../catalogue.service";
import {TaxCategory} from "../model/publish/tax-category";
import {UserService} from "../../user-mgmt/user.service";
import {CookieService} from "ng2-cookies";
import {Party} from "../model/publish/party";

@Component({
    selector: "product-price-tab",
    templateUrl: "./product-price-tab.component.html",
    styleUrls: ["./product-price-tab.component.css"],
    providers: [PriceOptionCountPipe, PriceOptionPipe],
})
export class ProductPriceTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() companyNegotiationSettings:CompanyNegotiationSettings;
    @Input() disabled: boolean

    // TODO: later, get these from a service?
    CURRENCIES = CURRENCIES;
    priceOptions = PRICE_OPTIONS;
    object = Object;

    discountUnits = [];
    defaultVatRate: number = 20;
    static vatRates: any = null;

    constructor(private catalogueService: CatalogueService,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    ngOnInit() {
        this.updateDiscountUnits();

        let vatRatesPromise: Promise<any> = Promise.resolve(ProductPriceTabComponent.vatRates);
        if(ProductPriceTabComponent.vatRates == null) {
            vatRatesPromise = this.catalogueService.getTaxRates();
        }

        let userId: string = this.cookieService.get("user_id");
        let userPartyPromise: Promise<Party> = this.userService.getUserParty(userId);

        Promise.all(
            [vatRatesPromise, userPartyPromise])
            .then(([rates, party]) => {
                ProductPriceTabComponent.vatRates = rates;
                this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent = this.getVatRateForCountry(party);

            }).catch(error => {
                this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent = this.defaultVatRate;
            });

        if(this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory == null || this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory.length == 0) {
            this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory = [new TaxCategory()];
        }
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

    private getVatRateForCountry(userParty: Party): number {
        if(ProductPriceTabComponent.vatRates != null) {
            for(let countryCode of Object.keys(ProductPriceTabComponent.vatRates.rates)) {
                if(ProductPriceTabComponent.vatRates.rates[countryCode].country_name == userParty.postalAddress.country.name.value) {
                    return ProductPriceTabComponent.vatRates.rates[countryCode].standard_rate;
                }
            }
        }
        return this.defaultVatRate;
    }
}
