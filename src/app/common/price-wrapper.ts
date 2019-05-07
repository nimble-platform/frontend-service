import { Price } from "../catalogue/model/publish/price";
import { Quantity } from "../catalogue/model/publish/quantity";
import {currencyToString, roundToTwoDecimals} from "./utils";
import { ItemPriceWrapper } from "./item-price-wrapper";
import {PriceOption} from '../catalogue/model/publish/price-option';
import {PRICE_OPTIONS} from '../catalogue/model/constants';
import {ItemProperty} from '../catalogue/model/publish/item-property';
import {Address} from '../catalogue/model/publish/address';
import {Text} from '../catalogue/model/publish/text';
import {Country} from '../catalogue/model/publish/country';

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
    // the item price wrapper which is used when we pass this price wrapper as quantity to QuantityInputComponent
    quantityPrice: ItemPriceWrapper;
    // these fields are used to check whether we need to update quotation price or not
    quotationIncotermUpdated = true;
    quotationDeliveryPeriodUpdated = true;
    quotationPaymentMeansUpdated = true;
    // this presentation mode is used to calculate total price for quotation
    presentationMode:string = 'edit';
    // this field is used to create discount-modal view
    appliedDiscounts: PriceOption[] = [];

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
        this.quantityPrice = new ItemPriceWrapper(this.quotationLinePrice);
    }

    get totalPrice(): number {
        // if this PriceWrapper has a quotation price but we do not need to update it, simply return.
        if(this.quantityPrice.price && !this.quotationIncotermUpdated && !this.quotationPaymentMeansUpdated && !this.quotationDeliveryPeriodUpdated){
            if(!this.quotationHasPrice()){
                return 0;
            }
            return this.quantityPrice.price.priceAmount.value * this.quantity.value;
        }

        if(!this.hasPrice()) {
            return 0;
        }

        const amount = Number(this.price.priceAmount.value);
        const baseQuantity = this.price.baseQuantity.value || 1;
        let totalPrice = this.quantity.value * amount / baseQuantity;

        let totalDiscount:number = 0;
        let totalMinimumOrderQuantityDiscount = 0;
        let minimumOrderQuantityPriceOption:PriceOption = null;
        let totalDeliveryPeriodDiscount = 0;
        let deliveryPeriodPriceOption:PriceOption = null;

        // reset appliedDiscounts
        this.appliedDiscounts = [];

        // if removeDiscountAmount is true, then calculate totalDiscount value, otherwise totalDiscount is 0
        if(this.removeDiscountAmount){
            // check for price options
            for(let priceOption of this.priceOptions){
                // check for incoterms
                if(this.incoterm && priceOption.typeID == PRICE_OPTIONS.INCOTERM.typeID && priceOption.incoterms.indexOf(this.incoterm) != -1){
                    priceOption.discount = this.calculateDiscountAmount(priceOption,totalPrice);
                    totalDiscount += priceOption.discount;
                    // add this discount to appliedDiscounts list

                    this.appliedDiscounts.push(priceOption);
                }
                // check for paymentMeans
                else if(this.paymentMeans && priceOption.typeID == PRICE_OPTIONS.PAYMENT_MEAN.typeID && priceOption.paymentMeans[0].paymentMeansCode.value == this.paymentMeans){
                    priceOption.discount = this.calculateDiscountAmount(priceOption,totalPrice);
                    totalDiscount += priceOption.discount;
                    // add this discount to appliedDiscounts list
                    this.appliedDiscounts.push(priceOption);
                }
                // check for minimum order quantity
                else if(priceOption.typeID == PRICE_OPTIONS.ORDERED_QUANTITY.typeID && priceOption.itemLocationQuantity.minimumQuantity.unitCode == this.quantity.unitCode
                    && this.quantity.value >= priceOption.itemLocationQuantity.minimumQuantity.value){
                    let qDiscount = this.calculateDiscountAmount(priceOption,totalPrice);
                    if(qDiscount > totalMinimumOrderQuantityDiscount) {
                        totalMinimumOrderQuantityDiscount = qDiscount;
                        minimumOrderQuantityPriceOption = priceOption;
                    }
                }
                // check for delivery period
                else if (this.deliveryPeriod && priceOption.typeID == PRICE_OPTIONS.DELIVERY_PERIOD.typeID &&
                    priceOption.estimatedDeliveryPeriod.durationMeasure.unitCode == this.deliveryPeriod.unitCode &&
                    priceOption.estimatedDeliveryPeriod.durationMeasure.value <= this.deliveryPeriod.value) {

                    let dpDiscount = this.calculateDiscountAmount(priceOption, totalPrice);
                    if (dpDiscount > totalMinimumOrderQuantityDiscount) {
                        totalDeliveryPeriodDiscount = dpDiscount;
                        deliveryPeriodPriceOption = priceOption;
                    }
                }
                // check for additional item properties
                else if(this.additionalItemProperties.length > 0 && priceOption.typeID == PRICE_OPTIONS.PRODUCT_PROPERTY.typeID){
                    for(let property of this.additionalItemProperties){
                        // check if a property is already selected for this discount option
                        if(priceOption.additionalItemProperty.length == 0) {
                            continue;
                        }
                        if(property.id == priceOption.additionalItemProperty[0].id && this.existenceOfPriceOptionForPropertyValue(priceOption.additionalItemProperty[0].value,property.value[0])){
                            priceOption.discount = this.calculateDiscountAmount(priceOption,totalPrice);
                            totalDiscount += priceOption.discount;
                            // add this discount to appliedDiscounts list
                            this.appliedDiscounts.push(priceOption);
                        }
                    }
                }
                else if(priceOption.typeID == PRICE_OPTIONS.DELIVERY_LOCATION.typeID && this.deliveryLocation){
                    // check whether addresses are the same or not
                    let checkStreetName = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].streetName != "";
                    let checkBuildingNumber = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].buildingNumber != "";
                    let checkPostalZone = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].postalZone != "";
                    let checkCityName = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].cityName != "";
                    let checkRegion = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].region != "";
                    let country:Country = priceOption.itemLocationQuantity.applicableTerritoryAddress[0].country;
                    let checkCountryName = country && country.name.value && country.name.value != "";
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
                    if(checkRegion && priceOption.itemLocationQuantity.applicableTerritoryAddress[0].region.toLocaleLowerCase() != this.deliveryLocation.region.toLocaleLowerCase()){
                        continue;
                    }
                    if(checkCountryName && priceOption.itemLocationQuantity.applicableTerritoryAddress[0].country.name.value.toLocaleLowerCase() != this.deliveryLocation.country.name.value.toLocaleLowerCase()){
                        continue;
                    }
                    // the delivery location satisfies all conditions
                    priceOption.discount = this.calculateDiscountAmount(priceOption,totalPrice);
                    totalDiscount += priceOption.discount;
                    // add this discount to appliedDiscounts list
                    this.appliedDiscounts.push(priceOption);
                }
            }
        }

        // add the individual discounts
        totalDiscount += totalMinimumOrderQuantityDiscount;
        totalDiscount += totalDeliveryPeriodDiscount;

        if(minimumOrderQuantityPriceOption != null){
            minimumOrderQuantityPriceOption.discount = totalMinimumOrderQuantityDiscount;
            this.appliedDiscounts.push(minimumOrderQuantityPriceOption);
        }
        if(deliveryPeriodPriceOption != null){
            deliveryPeriodPriceOption.discount = totalDeliveryPeriodDiscount;
            this.appliedDiscounts.push(deliveryPeriodPriceOption);
        }

        // if PriceWrapper has a quotation price, then we have to update it with the calculated total price
        if(this.quantityPrice.price){
            this.quantityPrice.price.priceAmount.value = (totalPrice-totalDiscount)/this.quantity.value;

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

        return `${totalPrice/qty.value} ${currencyToString(this.price.priceAmount.currencyID)} per ${qty.unitCode}`
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
         return this.quantityPrice.price.priceAmount.value != null;
    }

    /**
     * Getters/Setters for quantity
     */

    get value(): number {
        // if presentation mode is edit, then we have to calculate total price
        if(this.presentationMode == 'edit'){
            return this.totalPrice;
        }
        return this.quantityPrice.price.priceAmount.value*this.quantity.value;

    }

    set value(value: number) {
        // reset appliedDiscounts to make UI part of negotiation response consistent
        this.appliedDiscounts = [];
        this.quantityPrice.price.priceAmount.value = value/this.quantity.value;
    }

    get unitCode(): string {
        return this.quantityPrice.price.priceAmount.currencyID;
    }

    set unitCode(unitCode: string) {
        this.quantityPrice.price.priceAmount.currencyID = unitCode;
    }

    // used to get quantity price when presentation mode is edit
    public getQuantityPrice(){
        return this.quantityPrice.price.priceAmount.value*this.quantity.value;
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
                discount += totalPrice*priceOption.itemLocationQuantity.allowanceCharge[0].amount.value/100.0;
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

    // checks whether there's a price option for the selected property value or not
    private existenceOfPriceOptionForPropertyValue(priceOptionPropertyValues:Text[],selectedPropertyValue:Text):boolean{
        for(let property of priceOptionPropertyValues){
            if(property.value == selectedPropertyValue.value && property.languageID == selectedPropertyValue.languageID){
                return true;
            }
        }
        return false;
    }
}
