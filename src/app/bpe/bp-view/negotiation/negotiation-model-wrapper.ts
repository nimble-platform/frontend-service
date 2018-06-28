import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Price } from "../../../catalogue/model/publish/price";
import { Amount } from "../../../catalogue/model/publish/amount";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PAYMENT_MEANS } from "../../../catalogue/model/constants";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { quantityToString, durationToString } from "../../../common/utils";
import { PriceWrapper } from "../price-wrapper";

/**
 * Convenient getters (and some setters) for catalogue line, request for quotations and quotations.
 * This class also serves as a bit of documentation on the model.
 */
export class NegotiationModelWrapper {

    public rfqPaymentTerms: PaymentTermsWrapper;
    public quotationPaymentTerms: PaymentTermsWrapper;
    public linePriceWrapper: PriceWrapper;
    public rfqPriceWrapper: PriceWrapper;
    public quotationPriceWrapper: PriceWrapper;

    constructor(public line: CatalogueLine,
                public rfq: RequestForQuotation,
                public quotation: Quotation) {
        
        this.rfqPaymentTerms = new PaymentTermsWrapper(rfq.paymentTerms);
        if(quotation) {
            this.quotationPaymentTerms = new PaymentTermsWrapper(quotation.paymentTerms);
        }

        this.linePriceWrapper = new PriceWrapper(
            line.requiredItemLocationQuantity.price,
            rfq.requestForQuotationLine[0].lineItem.quantity
        );
        this.rfqPriceWrapper = new PriceWrapper(
            rfq.requestForQuotationLine[0].lineItem.price,
            rfq.requestForQuotationLine[0].lineItem.quantity
        )
        if(quotation) {
            this.quotationPriceWrapper = new PriceWrapper(
                quotation.quotationLine[0].lineItem.price,
                quotation.quotationLine[0].lineItem.quantity
            );
        }
    }

    public get linePricePerItemString(): string {
        return this.linePriceWrapper.pricePerItemString;
    }

    public get lineTotalPrice(): number {
        return this.linePriceWrapper.totalPrice;
    }

    public get lineTotalPriceString(): string {
        return this.linePriceWrapper.totalPriceString;
    }


    public get rfqPricePerItemString(): string {
        return this.rfqPriceWrapper.pricePerItemString;
    }

    public get rfqTotalPrice(): number {
        return this.rfqPriceWrapper.totalPrice;
    }

    public get rfqTotalPriceString(): string {
        return this.rfqPriceWrapper.totalPriceString;
    }

    public get rfqTotalPriceStringIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPriceWrapper.totalPriceString, this.rfq.negotiationOptions.price);
    }

    public get quotationPriceAmount(): Amount {
        return this.quotation.quotationLine[0].lineItem.price.priceAmount;
    }

    public get rfqQuantity(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.quantity;
    }

    public get quotationQuantity(): Quantity {
        return this.quotation.quotationLine[0].lineItem.quantity;
    }

    public get lineDeliveryPeriod(): Quantity {
        return this.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;
    }

    public get lineDeliveryPeriodString(): string {
        return quantityToString(this.lineDeliveryPeriod);
    }

    public get rfqDeliveryPeriod(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    public get rfqDeliveryPeriodString(): string {
        return quantityToString(this.rfqDeliveryPeriod);
    }

    public get rfqDeliveryPeriodStringIfNegotiating(): string {
        return this.qtyToStringIfNegotiating(this.rfqDeliveryPeriod, this.rfq.negotiationOptions.deliveryPeriod);
    }

    public get quotationDeliveryPeriod(): Quantity {
        return this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    public get lineWarranty(): Quantity {
        return this.line.warrantyValidityPeriod.durationMeasure;
    }

    public get lineWarrantyString(): string {
        return durationToString(this.lineWarranty);
    }

    public get rfqWarranty(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public get rfqWarrantyString(): string {
        return durationToString(this.rfqWarranty);
    }

    public get rfqWarrantyStringIfNegotiating(): string {
        return this.qtyToStringIfNegotiating(this.rfqWarranty, this.rfq.negotiationOptions.warranty);
    }

    public get quotationWarranty(): Quantity {
        return this.quotation.quotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public get lineIncoterms(): string {
        return this.line.goodsItem.deliveryTerms.incoterms;
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
        return this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms;
    }

    public set quotationIncoterms(incoterms: string) {
        this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms = incoterms;
    }

    public get linePaymentTerms(): string {
        return UBLModelUtils.getDefaultPaymentTermsAsStrings()[0];
    }

    public get rfqPaymentTermsToString(): string {
        return this.rfqPaymentTerms.paymentTerm;
    }

    public get rfqPaymentTermsIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPaymentTerms.paymentTerm, this.rfq.negotiationOptions.paymentTerms);
    }

    public get linePaymentMeans(): string {
        return PAYMENT_MEANS[0];
    }

    public get rfqPaymentMeans(): string {
        return this.rfq.paymentMeans.paymentMeansCode.name;
    }

    public set rfqPaymentMeans(paymentMeans: string) {
        this.rfq.paymentMeans.paymentMeansCode.name = paymentMeans;
    }

    public get quotationPaymentMeans(): string {
        return this.quotation.paymentMeans.paymentMeansCode.name;
    }

    public set quotationPaymentMeans(paymentMeans: string) {
        this.quotation.paymentMeans.paymentMeansCode.name = paymentMeans;
    }

    public get rfqPaymentMeansIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPaymentMeans, this.rfq.negotiationOptions.paymentMeans);
    }

    private qtyToStringIfNegotiating(qty: Quantity, negotiating: boolean): string {
        if(!negotiating) {
            return "";
        }

        return quantityToString(qty);
    }

    private IfNegotiating(value: string, negotiating: boolean): string {
        return negotiating ? value : "";
    }
}