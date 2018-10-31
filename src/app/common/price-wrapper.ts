import { Price } from "../catalogue/model/publish/price";
import { Quantity } from "../catalogue/model/publish/quantity";
import { currencyToString } from "./utils";
import { ItemPriceWrapper } from "./item-price-wrapper";
import {PriceOption} from '../catalogue/model/publish/price-option';
import {PRICE_OPTIONS} from '../catalogue/model/constants';
import {ItemProperty} from '../catalogue/model/publish/item-property';
import {Address} from '../catalogue/model/publish/address';

/**
 * Wrapper around a price and a quantity, contains convenience methods to get the total price,
 * price per item and their string representations.
 *
 * This class can also be substituted for a Quantity.
 */
export class PriceWrapper {
    /** hjid field from Quantity class */
    hjid: string = null;

    itemPrice: ItemPriceWrapper;
    // quotation total price
    // this field is used to calculate quotation response price correctly
    quotationPrice: ItemPriceWrapper;
    // these fields are used to check whether we need to update quotation price or not
    quotationIncotermUpdated = false;
    quotationDeliveryPeriodUpdated = false;
    quotationPaymentMeansUpdated = false;

    constructor(public price: Price,
                public quantity: Quantity = new Quantity(1, price.baseQuantity.unitCode),
                public priceOptions:PriceOption[] = [],
                public additionalItemProperties:ItemProperty[] = [],
                public incoterm:string = null,
                public paymentMeans:string = null,
                public deliveryPeriod: Quantity = null,
                public deliveryLocation: Address = null,
                public quotationLinePrice: Price = null,
                public removeDiscountAmount: boolean = true) {
        this.itemPrice = new ItemPriceWrapper(price);
        this.quotationPrice = new ItemPriceWrapper(this.quotationLinePrice);
    }

    get totalPrice(): number {
        // if this PriceWrapper has a quotation price but we do not need to update it, simply return.
        if(this.quotationPrice.price && !this.quotationIncotermUpdated && !this.quotationPaymentMeansUpdated && !this.quotationDeliveryPeriodUpdated){
            if(!this.quotationHasPrice()){
                return 0;
            }
            return this.quotationPrice.price.priceAmount.value;
        }

        if(!this.hasPrice()) {
            return 0;
        }

        const amount = Number(this.price.priceAmount.value);
        const baseQuantity = this.price.baseQuantity.value || 1;
        let totalPrice = this.roundPrice(this.quantity.value * amount / baseQuantity);

        let totalDiscount:number = 0;

        // if removeDiscountAmount is true, then calculate totalDiscount value, otherwise totalDiscount is 0
        if(this.removeDiscountAmount){
            // check for price options
            for(let priceOption of this.priceOptions){
                // check for incoterms
                if(this.incoterm && priceOption.typeID == PRICE_OPTIONS.INCOTERM.typeID && priceOption.incoterms.indexOf(this.incoterm) != -1){
                    totalDiscount += this.calculateDiscountAmount(priceOption,totalPrice);
                }
                // check for paymentMeans
                else if(this.paymentMeans && priceOption.typeID == PRICE_OPTIONS.PAYMENT_MEAN.typeID && priceOption.paymentMeans[0].instructionNote == this.paymentMeans){
                    totalDiscount += this.calculateDiscountAmount(priceOption,totalPrice);
                }
                // check for minimum order quantity
                else if(priceOption.typeID == PRICE_OPTIONS.ORDERED_QUANTITY.typeID && priceOption.itemLocationQuantity.minimumQuantity.unitCode == this.quantity.unitCode
                    && this.quantity.value >= priceOption.itemLocationQuantity.minimumQuantity.value){
                    totalDiscount += this.calculateDiscountAmount(priceOption,totalPrice);
                }
                // check for delivery period
                else if(this.deliveryPeriod && priceOption.typeID == PRICE_OPTIONS.DELIVERY_PERIOD.typeID && priceOption.estimatedDeliveryPeriod.durationMeasure.unitCode == this.deliveryPeriod.unitCode
                    && priceOption.estimatedDeliveryPeriod.durationMeasure.value == this.deliveryPeriod.value){
                    totalDiscount += this.calculateDiscountAmount(priceOption,totalPrice);
                }
                // check for additional item properties
                else if(this.additionalItemProperties.length > 0 && priceOption.typeID == PRICE_OPTIONS.PRODUCT_PROPERTY.typeID){
                    for(let property of this.additionalItemProperties){
                        if(property.id == priceOption.additionalItemProperty[0].id && priceOption.additionalItemProperty[0].value.indexOf(property.value[0]) != -1){
                            totalDiscount += this.calculateDiscountAmount(priceOption,totalPrice);
                        }
                    }
                }
                else if(priceOption.typeID == PRICE_OPTIONS.DELIVERY_LOCATION.typeID && this.deliveryLocation){
                    // check whether addresses are the same or not
                    let checkStreetName = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].streetName != "";
                    let checkBuildingNumber = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].buildingNumber != "";
                    let checkPostalZone = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].postalZone != "";
                    let checkCityName = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].cityName != "";
                    let checkCountryName = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].country && priceOption.itemLocationQuantity.applicableTerritoryAddress[0].country.name != "";
                    if(checkStreetName && priceOption.itemLocationQuantity.applicableTerritoryAddress[0].streetName.toLocaleLowerCase() != this.deliveryLocation.streetName.toLocaleLowerCase()){
                        continue;
                    }
                    if(checkBuildingNumber && priceOption.itemLocationQuantity.applicableTerritoryAddress[0].buildingNumber != this.deliveryLocation.buildingNumber){
                        continue;
                    }
                    if(checkPostalZone && priceOption.itemLocationQuantity.applicableTerritoryAddress[0].postalZone != this.deliveryLocation.postalZone){
                        continue;
                    }
                    if(checkCityName && priceOption.itemLocationQuantity.applicableTerritoryAddress[0].cityName.toLocaleLowerCase() != this.deliveryLocation.cityName.toLocaleLowerCase()){
                        continue;
                    }
                    if(checkCountryName && priceOption.itemLocationQuantity.applicableTerritoryAddress[0].country.name.toLocaleLowerCase() != this.deliveryLocation.country.name.toLocaleLowerCase()){
                        continue;
                    }
                    // the delivery location satisfies all conditions
                    totalDiscount += this.calculateDiscountAmount(priceOption,totalPrice);
                }
            }
        }
        // if PriceWrapper has a quotation price, then we have to update it with the calculated total price
        if(this.quotationPrice.price){
            this.quotationPrice.price.priceAmount.value = totalPrice-totalDiscount;

            this.quotationDeliveryPeriodUpdated = false;
            this.quotationIncotermUpdated = false;
            this.quotationPaymentMeansUpdated = false;
        }

        return totalPrice-totalDiscount;
    }

    set totalPrice(price: number) {
        const quantity = this.quantity.value || 1;
        const baseQuantity = this.price.baseQuantity.value || 1;
        this.price.priceAmount.value = price / quantity * baseQuantity
    }

    get totalPriceString(): string {
        if(!this.hasPrice()) {
            return "Not specified";
        }
        return `${this.totalPrice} ${this.currency}`;
    }

    get pricePerItemString(): string {
        const totalPrice = this.totalPrice;
        const qty = this.quantity;

        if(totalPrice == 0 || !qty.value) {
            return "On demand";
        }

        if(this.price.baseQuantity.value === 1) {
            return `${this.roundPrice(totalPrice/qty.value)} ${currencyToString(this.price.priceAmount.currencyID)} per ${this.price.baseQuantity.unitCode}`
        }
        return `${this.roundPrice(totalPrice/qty.value)} ${currencyToString(this.price.priceAmount.currencyID)} for ${this.price.baseQuantity.value} ${this.price.baseQuantity.unitCode}`
    }

    get currency(): string {
        return currencyToString(this.price.priceAmount.currencyID);
    }
    
    set currency(currency: string) {
        this.price.priceAmount.currencyID = currency;
    }
    
    hasPrice(): boolean {
        // != here gives "not null or undefined", which is the behaviour we want.
        return this.price.priceAmount.value != null;
    }

    quotationHasPrice() :boolean{
         return this.quotationPrice.price.priceAmount.value != null;
    }

    private roundPrice(value: number): number {
        return Math.round(value * 100) / 100;
    }

    /**
     * Getters/Setters for quantity
     * These are used to set or get quotation price
     */

    get value(): number {
        return this.totalPrice;
    }

    set value(value: number) {
        this.quotationPrice.price.priceAmount.value = value;
    }

    get unitCode(): string {
        return this.quotationPrice.price.priceAmount.currencyID;
    }

    set unitCode(unitCode: string) {
        this.quotationPrice.price.priceAmount.currencyID = unitCode;
    }

    /**
     *  Price options functions
     */

    private calculateDiscountAmount(priceOption:PriceOption,totalPrice:number): number{
        let discount = 0;

        // total price
        if(priceOption.itemLocationQuantity.allowanceCharge[0].amount && priceOption.itemLocationQuantity.allowanceCharge[0].amount.value){
            // unit is %
            if(priceOption.itemLocationQuantity.allowanceCharge[0].amount.currencyID == "%"){
                discount += this.roundPrice(totalPrice*priceOption.itemLocationQuantity.allowanceCharge[0].amount.value/100);
            }
            // unit is not %
            else {
                discount += priceOption.itemLocationQuantity.allowanceCharge[0].amount.value;
            }
        }
        // per unit
        else if(priceOption.itemLocationQuantity.allowanceCharge[0].perUnitAmount.value){
            discount += priceOption.itemLocationQuantity.allowanceCharge[0].perUnitAmount.value * this.quantity.value;
        }

        return discount;
    }
}