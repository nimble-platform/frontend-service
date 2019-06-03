import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import {copy, durationToString, roundToTwoDecimals} from "../../../common/utils";
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
    public quotationDiscountPriceWrapper: DiscountPriceWrapper;

    public newQuotationWrapper: QuotationWrapper;
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

        if(catalogueLine) {
            this.initialImmutableCatalogueLine = copy(catalogueLine);
        }

        // discount price wrappers
        if(catalogueLine && rfq) {
            // first construct wrappers
            this.lineDiscountPriceWrapper = new DiscountPriceWrapper(
                catalogueLine.requiredItemLocationQuantity.price,
                copy(catalogueLine.requiredItemLocationQuantity.price), // we don't want the original catalogueLine.requiredItemLocationQuantity.price to be updated in price changes
                catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
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
                catalogueLine.requiredItemLocationQuantity.price,
                rfq.requestForQuotationLine[0].lineItem.price,
                catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
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
                    catalogueLine.requiredItemLocationQuantity.price,
                    newQuotation.quotationLine[0].lineItem.price,
                    catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
                    newQuotation.quotationLine[0].lineItem.quantity,
                    catalogueLine.priceOption,
                    rfq.requestForQuotationLine[0].lineItem.item.additionalItemProperty,
                    rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms,
                    rfq.paymentMeans.paymentMeansCode.value,
                    rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure,
                    rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address
                );
            }
        }

        if(newQuotation) {
            this.newQuotationWrapper = new QuotationWrapper(newQuotation, catalogueLine);
        }

        if(frameContractQuotation) {
            this.frameContractQuotationWrapper = new QuotationWrapper(frameContractQuotation, catalogueLine);
        }

        if(lastOfferQuotation) {
            this.lastOfferQuotationWrapper = new QuotationWrapper(lastOfferQuotation, catalogueLine);
        }
    }

    /**
     * Getter methods for the line which is updated based on activities of the
     */

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

    public get lineVatPercentage(): number {
        return this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent;
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

    public get rfqPricePerItemString(): string {
        return this.rfqDiscountPriceWrapper.pricePerItemString;
    }

    public get rfqTotalPriceString(): string {
        return this.rfqDiscountPriceWrapper.totalPriceString;
    }

    public get rfqVatTotal(): number {
        return this.rfqDiscountPriceWrapper.totalPrice * this.lineVatPercentage / 100;
    }

    public get rfqVatTotalString(): string {
        return `${this.rfqVatTotal} ${this.rfqDiscountPriceWrapper.itemPrice.currency}`
    }

    public get rfqGrossTotal(): number {
        return this.rfqDiscountPriceWrapper.totalPrice + this.rfqVatTotal;
    }

    public get rfqGrossTotalString(): string {
        return `${roundToTwoDecimals(this.rfqGrossTotal)} ${this.rfqDiscountPriceWrapper.itemPrice.currency}`
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

    public get rfqWarranty(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public set rfqWarranty(quantity: Quantity) {
        this.rfq.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure = quantity;
    }

    public get rfqWarrantyString(): string {
        return durationToString(this.rfqWarranty);
    }

    public get rfqIncoterms(): string {
        return this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms;
    }

    public set rfqIncoterms(incoterms: string) {
        this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms = incoterms;
    }

    public get rfqPaymentTermsToString(): string {
        return this.rfqPaymentTerms.paymentTerm;
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

    public get rfqDeliveryAddress(): Address {
        return this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
    }
}
