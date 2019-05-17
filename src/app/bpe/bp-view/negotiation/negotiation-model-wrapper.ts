import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Amount } from "../../../catalogue/model/publish/amount";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import {copy, durationToString, periodToString} from "../../../common/utils";
import { PriceWrapper } from "../../../common/price-wrapper";
import { Address } from "../../../catalogue/model/publish/address";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";
import {TradingTerm} from "../../../catalogue/model/publish/trading-term";
import {MultiTypeValue} from "../../../catalogue/model/publish/multi-type-value";
import {DiscountPriceWrapper} from "../../../common/discount-price-wrapper";
import {QuotationWrapper} from "./quotation-wrapper";

/**
 * Convenient getters (and some setters) for catalogue line, request for quotations and quotations.
 * This class also serves as a bit of documentation on the model.
 */
export class NegotiationModelWrapper {

    public rfqPaymentTerms: PaymentTermsWrapper;
    public lineDiscountPriceWrapper: DiscountPriceWrapper; // price wrapper to calculate the discount based on the updated terms
    public rfqDiscountPriceWrapper: DiscountPriceWrapper;

    public quotationPaymentTerms: PaymentTermsWrapper;
    public quotationPriceWrapper: PriceWrapper;
    public quotationDiscountPriceWrapper: DiscountPriceWrapper;
    public quotationTotalPrice: Quantity;

    public frameContractQuotationWrapper: QuotationWrapper;
    public lastOfferQuotationWrapper: QuotationWrapper;

    initialImmutableRfq: RequestForQuotation; // immutable rfq object that is used to load manufacturers' terms defined as product defaults
    initialImmutableCatalogueLine: CatalogueLine; // immutable catalogue line

    constructor(public catalogueLine: CatalogueLine,
                public rfq: RequestForQuotation,
                public newQuotation: Quotation, // quotation object of the current negotiation step instantiated as a result of the rfq. It's supposed to be provided in the negotiation response phase
                public frameContractQuotation: Quotation, // quotation object associated to a frame contract, if any
                public lastOfferQuotation: Quotation, // in second or later steps of negotiation, this parameter keeps the quotation coming from the previous step
                public settings: CompanyNegotiationSettings) {

        if(rfq) {
            this.initialImmutableRfq = copy(rfq);
            this.rfqPaymentTerms = new PaymentTermsWrapper(rfq.paymentTerms);
        }
        if(newQuotation) {
            this.quotationPaymentTerms = new PaymentTermsWrapper(newQuotation.paymentTerms);
        }
        // price wrappers
        if(newQuotation) {
            this.quotationPriceWrapper = new PriceWrapper(newQuotation.quotationLine[0].lineItem.price, newQuotation.quotationLine[0].lineItem.quantity);
        }

        if(catalogueLine) {
            this.initialImmutableCatalogueLine = copy(catalogueLine);
        }

        // discount price wrappers
        if(catalogueLine && rfq) {
            // first construct wrappers
            this.lineDiscountPriceWrapper = new DiscountPriceWrapper(
                catalogueLine.requiredItemLocationQuantity.price.priceAmount.value,
                copy(catalogueLine.requiredItemLocationQuantity.price), // we don't want the original catalogueLine.requiredItemLocationQuantity.price to be updated in price changes
                rfq.requestForQuotationLine[0].lineItem.quantity,
                catalogueLine.priceOption,
                rfq.requestForQuotationLine[0].lineItem.item.additionalItemProperty,
                rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms,
                rfq.paymentMeans.paymentMeansCode.value,
                rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure,
                rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address,
                //null,
                //true // disable calculation of discounts
            );
            this.rfqDiscountPriceWrapper = new DiscountPriceWrapper(
                catalogueLine.requiredItemLocationQuantity.price.priceAmount.value,
                rfq.requestForQuotationLine[0].lineItem.price,
                rfq.requestForQuotationLine[0].lineItem.quantity,
                catalogueLine.priceOption,
                rfq.requestForQuotationLine[0].lineItem.item.additionalItemProperty,
                rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms,
                rfq.paymentMeans.paymentMeansCode.value,
                rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure,
                rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address
            );

            if(newQuotation) {
                this.quotationDiscountPriceWrapper = new DiscountPriceWrapper(
                    catalogueLine.requiredItemLocationQuantity.price.priceAmount.value,
                    newQuotation.quotationLine[0].lineItem.price,
                    newQuotation.quotationLine[0].lineItem.quantity,
                    catalogueLine.priceOption,
                    rfq.requestForQuotationLine[0].lineItem.item.additionalItemProperty,
                    rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms,
                    rfq.paymentMeans.paymentMeansCode.value,
                    rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure,
                    rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address,
                    newQuotation.quotationLine[0].lineItem.price
                );
            }
        }

        if(this.quotationDiscountPriceWrapper) {
            this.quotationTotalPrice = new Quantity(this.quotationDiscountPriceWrapper.totalPrice, this.quotationDiscountPriceWrapper.currency);
        }

        if(frameContractQuotation) {
            this.frameContractQuotationWrapper = new QuotationWrapper(frameContractQuotation);
        }

        if(lastOfferQuotation) {
            this.lastOfferQuotationWrapper = new QuotationWrapper(lastOfferQuotation);
        }
    }

    /**
     * Getter methods for the line which is updated based on activities of the
     */

    public get linePricePerItemString(): string {
        //this.updateLinePriceWrapperFields();
        return this.lineDiscountPriceWrapper.pricePerItemString;
    }

    public get lineTotalPrice(): number {
        return this.lineDiscountPriceWrapper.totalPrice;
    }

    public get lineTotalPriceString(): string {
        //this.updateLinePriceWrapperFields();
        return this.lineDiscountPriceWrapper.totalPriceString;
    }

    public get lineDeliveryPeriod(): Quantity {
        return this.catalogueLine.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;
    }

    public get lineDeliveryPeriodString(): string {
        return durationToString(this.lineDeliveryPeriod);
    }

    public get lineWarranty(): Quantity {
        return this.catalogueLine.warrantyValidityPeriod.durationMeasure;
    }

    public get lineWarrantyString(): string {
        return durationToString(this.lineWarranty);
    }

    public get lineIncoterms(): string {
        return this.catalogueLine.goodsItem.deliveryTerms.incoterms;
    }

    public get linePaymentTerms(): string {
        return this.settings.paymentTerms[0];
    }

    public get linePaymentMeans(): string {
        return this.settings.paymentMeans[0];
    }

    /**
     * Methods for retrieving terms from the original line
     */

    public get originalLineDeliveryPeriod(): Quantity {
        return this.initialImmutableCatalogueLine.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;
    }

    public get originalLineWarranty(): Quantity {
        return this.initialImmutableCatalogueLine.warrantyValidityPeriod.durationMeasure;
    }

    public get originalLineIncoterms(): string {
        return this.initialImmutableCatalogueLine.goodsItem.deliveryTerms.incoterms;
    }

    // before calculating total price for line, we have to update linePriceWrapper fields so that it can calculate discount amount correctly
/*    private updateLinePriceWrapperFields(){
        this.lineDiscountPriceWrapper.incoterm = this.rfq.negotiationOptions.incoterms ? this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms : this.catalogueLine.goodsItem.deliveryTerms.incoterms;
        this.lineDiscountPriceWrapper.paymentMeans = this.rfq.negotiationOptions.paymentMeans ? this.rfq.paymentMeans.paymentMeansCode.value : this.settings.paymentMeans[0];
        this.lineDiscountPriceWrapper.deliveryPeriod = this.rfq.negotiationOptions.deliveryPeriod ? JSON.parse(JSON.stringify(this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure)): this.catalogueLine.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;
        this.lineDiscountPriceWrapper.deliveryLocation = this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
    }*/

    public get rfqPricePerItemString(): string {
        return this.rfqDiscountPriceWrapper.pricePerItemString;
    }

    public get rfqPricePerItemStringIfNegotiating(): string {
        return this.IfNegotiating(this.rfqDiscountPriceWrapper.pricePerItemString, this.rfq.negotiationOptions.price);
    }

    public get rfqTotalPrice(): number {
        return this.rfqDiscountPriceWrapper.totalPrice;
    }

    public get rfqTotalPriceString(): string {
        return this.rfqDiscountPriceWrapper.totalPriceString;
    }

    public get rfqTotalPriceStringIfNegotiating(): string {
        return this.IfNegotiating(this.rfqDiscountPriceWrapper.totalPriceString, this.rfq.negotiationOptions.price);
    }

    public get quotationPriceAmount(): Amount {
        return this.newQuotation.quotationLine[0].lineItem.price.priceAmount;
    }

    public get rfqQuantity(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.quantity;
    }

    public get quotationQuantity(): Quantity {
        return this.newQuotation.quotationLine[0].lineItem.quantity;
    }

    public get rfqDeliveryPeriod(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    public set rfqDeliveryPeriod(quantity: Quantity) {
        this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure = quantity;
    }

    public get rfqDeliveryPeriodString(): string {
        return durationToString(this.rfqDeliveryPeriod);
    }

    public get rfqDeliveryPeriodStringIfNegotiating(): string {
        return this.durationToStringIfNegotiating(this.rfqDeliveryPeriod, this.rfq.negotiationOptions.deliveryPeriod);
    }

    public get quotationDeliveryPeriod(): Quantity {
        return this.newQuotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    public get quotationDeliveryPeriodString(): string {
        return durationToString(this.quotationDeliveryPeriod);
    }

    public get quotationDeliveryPeriodWithPriceCheck(): Quantity {
        // update quotation delivery period to calculate price correctly
        if(this.quotationDiscountPriceWrapper != null && this.quotationDeliveryPeriod.value && (
                this.quotationDiscountPriceWrapper.deliveryPeriod.value != this.quotationDeliveryPeriod.value ||
                this.quotationDiscountPriceWrapper.deliveryPeriod.unitCode != this.quotationDeliveryPeriod.unitCode)){

            this.quotationDiscountPriceWrapper.deliveryPeriod = JSON.parse(JSON.stringify(this.quotationDeliveryPeriod));
            // make this field true so that quotation price will be updated
            this.quotationDiscountPriceWrapper.quotationDeliveryPeriodUpdated = true;
        }
        return this.quotationDeliveryPeriod;
    }

    public get rfqWarranty(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public set rfqWarranty(quantity: Quantity) {
        this.rfq.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure = quantity;
    }

    public get rfqWarrantyString(): string {
        return durationToString(this.rfqWarranty);
    }

    public get rfqWarrantyStringIfNegotiating(): string {
        return this.durationToStringIfNegotiating(this.rfqWarranty, this.rfq.negotiationOptions.warranty);
    }

    public get quotationWarranty(): Quantity {
        return this.newQuotation.quotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public get quotationWarrantyString(): string {
        return durationToString(this.quotationWarranty);
    }

    public get rfqIncoterms(): string {
        return this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms;
    }

    public set rfqIncoterms(incoterms: string) {
        this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms = incoterms;
    }

    public get rfqIncotermsIfNegotiating(): string {
        return this.IfNegotiating(this.rfqIncoterms, this.rfq.negotiationOptions.incoterms);
    }

    public get quotationIncoterms(): string {
        // update quotation incoterm to calculate price correctly
        // TODO remove this logic from wrappers
        if(this.quotationDiscountPriceWrapper != null && this.quotationDiscountPriceWrapper.incoterm != this.newQuotation.quotationLine[0].lineItem.deliveryTerms.incoterms){
            this.quotationDiscountPriceWrapper.incoterm = this.newQuotation.quotationLine[0].lineItem.deliveryTerms.incoterms;
            // make this field true so that quotation price will be updated
            this.quotationDiscountPriceWrapper.quotationIncotermUpdated = true;
        }

        return this.newQuotation.quotationLine[0].lineItem.deliveryTerms.incoterms;
    }

    public get quotationIncotermsString(): string {
        return this.newQuotation.quotationLine[0].lineItem.deliveryTerms.incoterms || "None";
    }

    public set quotationIncoterms(incoterms: string) {
        this.newQuotation.quotationLine[0].lineItem.deliveryTerms.incoterms = incoterms;
    }

    public get rfqPaymentTermsToString(): string {
        return this.rfqPaymentTerms.paymentTerm;
    }

    public get rfqPaymentTermsIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPaymentTerms.paymentTerm, this.rfq.negotiationOptions.paymentTerms);
    }

    public get rfqPaymentMeans(): string {
        return this.rfq.paymentMeans.paymentMeansCode.value;
    }

    public set rfqPaymentMeans(paymentMeans: string) {
        this.rfq.paymentMeans.paymentMeansCode.value = paymentMeans;
    }

    public get rfqFrameContractDuration(): Quantity {
        let tradingTerm: TradingTerm = this.rfq.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if(tradingTerm != null) {
            return tradingTerm.value.valueQuantity[0];
        }
        return null;
    }

    public get rfqFrameContractDurationString(): string {
        let duration: Quantity = this.rfqFrameContractDuration;
        if(duration != null) {
            return durationToString(duration);
        }
        return null;
    }

    public set rfqFrameContractDuration(duration: Quantity) {
        let tradingTerm: TradingTerm = this.rfq.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if(tradingTerm == null) {
            tradingTerm = new TradingTerm("FRAME_CONTRACT_DURATION", null, null, new MultiTypeValue());
            tradingTerm.value.valueQuantity.push(duration)
            this.rfq.tradingTerms.push(tradingTerm);
        } else {
            tradingTerm.value.valueQuantity[0] = duration;
        }
    }

    public get quotationPaymentMeans(): string {
        // update quotation payment means to calculate quotation price correctly
        if(this.quotationDiscountPriceWrapper != null && this.quotationDiscountPriceWrapper.paymentMeans !=  this.newQuotation.paymentMeans.paymentMeansCode.value){
            this.quotationDiscountPriceWrapper.paymentMeans = this.newQuotation.paymentMeans.paymentMeansCode.value;
            // make this field true so that quotation price will be updated
            this.quotationDiscountPriceWrapper.quotationPaymentMeansUpdated = true;
        }
        return this.newQuotation.paymentMeans.paymentMeansCode.value;
    }

    public set quotationPaymentMeans(paymentMeans: string) {
        this.newQuotation.paymentMeans.paymentMeansCode.value = paymentMeans;
    }

    public get quotationFrameContractDuration(): Quantity {
        let tradingTerm: TradingTerm = this.newQuotation.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if(tradingTerm != null) {
            return tradingTerm.value.valueQuantity[0];
        }
        return null;
    }

    public set quotationFrameContractDuration(duration: Quantity) {
        let tradingTerm: TradingTerm = this.newQuotation.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if(tradingTerm == null) {
            tradingTerm = new TradingTerm("FRAME_CONTRACT_DURATION", null, null, new MultiTypeValue());
            tradingTerm.value.valueQuantity.push(duration)
            this.newQuotation.tradingTerms.push(tradingTerm);
        } else {
            tradingTerm.value.valueQuantity[0] = duration;
        }
    }

    public get rfqPaymentMeansIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPaymentMeans, this.rfq.negotiationOptions.paymentMeans);
    }

    public get rfqDeliveryAddress(): Address {
        return this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
    }

    private durationToStringIfNegotiating(qty: Quantity, negotiating: boolean): string {
        if(!negotiating) {
            return "";
        }

        return durationToString(qty);
    }

    private IfNegotiating(value: string, negotiating: boolean): string {
        return negotiating ? value : "";
    }
}
