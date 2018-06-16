import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Price } from "../../../catalogue/model/publish/price";
import { Amount } from "../../../catalogue/model/publish/amount";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PAYMENT_TERMS, PAYMENT_MEANS } from "../../../catalogue/model/constants";

/**
 * Convenient getters (and some setters) for catalogue line, request for quotations and quotations.
 * This class also serves as a bit of documentation on the model.
 */
export class NegotiationModelWrapper {

    constructor(public line: CatalogueLine,
                public rfq: RequestForQuotation,
                public quotation: Quotation) {

    }

    public get linePrice(): Price {
        return this.line.requiredItemLocationQuantity.price;
    }

    public get rfqPriceAmount(): Amount {
        return this.rfq.requestForQuotationLine[0].lineItem.price.priceAmount;
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
        return this.qtyToString(this.lineDeliveryPeriod);
    }

    public get rfqDeliveryPeriod(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
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
        return this.warrantyToString(this.lineWarranty);
    }

    public get rfqWarranty(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public get rfqWarrantyStringIfNegotiating(): string {
        return this.qtyToStringIfNegotiating(this.rfqWarranty, this.rfq.negotiationOptions.warranty);
    }

    public get quotationWaranty(): Quantity {
        return this.quotation.quotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    private warrantyToString(warranty: Quantity): string {
        if(!warranty || warranty.value <= 0) {
            return "None";
        }
        const warrantyStr = this.qtyToString(warranty);
        return warrantyStr === "" ? "None" : warrantyStr;
    }

    public get lineIncoterms(): string {
        return this.line.goodsItem.deliveryTerms.incoterms;
    }

    public get rfqIncoterms(): string {
        return this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms;
    }

    public get rfqIncotermsIfNegotiating(): string {
        return this.IfNegotiating(this.rfqIncoterms, this.rfq.negotiationOptions.incoterms);
    }

    public get quotationIncoterms(): string {
        return this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms;
    }

    public get linePaymentTerms(): string {
        // TODO: no payment terms on the catalogue line!
        return PAYMENT_TERMS[0];
    }

    public get rfqPaymentTerms(): string {
        return this.rfq.paymentTerms;
    }

    public get rfqPaymentTermsIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPaymentTerms, this.rfq.negotiationOptions.paymentTerms);
    }

    public get linePaymentMeans(): string {
        // TODO: no payment means on the catalogue line!
        return PAYMENT_MEANS[0];
    }

    public get rfqPaymentMeans(): string {
        return this.rfq.paymentMeans;
    }

    public get rfqPaymentMeansIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPaymentMeans, this.rfq.negotiationOptions.paymentMeans);
    }

    private qtyToString(qty: Quantity): string {
        return `${qty.value} ${qty.unitCode}`;
    }

    private qtyToStringIfNegotiating(qty: Quantity, negotiating: boolean): string {
        if(!negotiating) {
            return "";
        }

        return this.qtyToString(qty);
    }

    private IfNegotiating(value: string, negotiating: boolean): string {
        return negotiating ? value : "";
    }
}