import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Price } from "../../../catalogue/model/publish/price";
import { Amount } from "../../../catalogue/model/publish/amount";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PAYMENT_MEANS } from "../../../catalogue/model/constants";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { UblModelAccessors } from "../../../catalogue/model/ubl-model-accessors";

/**
 * Convenient getters (and some setters) for catalogue line, request for quotations and quotations.
 * This class also serves as a bit of documentation on the model.
 */
export class NegotiationModelWrapper {

    public rfqPaymentTerms: PaymentTermsWrapper;
    public quotationPaymentTerms: PaymentTermsWrapper;

    constructor(public line: CatalogueLine,
                public rfq: RequestForQuotation,
                public quotation: Quotation) {
        
        this.rfqPaymentTerms = new PaymentTermsWrapper(rfq.paymentTerms);
        if(quotation) {
            this.quotationPaymentTerms = new PaymentTermsWrapper(quotation.paymentTerms);
        }
    }

    public get linePrice(): Price {
        return this.line.requiredItemLocationQuantity.price;
    }

    public get lineTotalPrice(): number {
        return UblModelAccessors.getTotalPrice(
            this.line.requiredItemLocationQuantity, 
            this.rfq.requestForQuotationLine[0].lineItem.quantity.value
        );
    }

    public get lineTotalPriceString(): string {
        return UblModelAccessors.getTotalPriceString(
            this.line.requiredItemLocationQuantity, 
            this.rfq.requestForQuotationLine[0].lineItem.quantity.value
        );
    }

    public get rfqPriceAmount(): Amount {
        return this.rfq.requestForQuotationLine[0].lineItem.price.priceAmount;
    }

    public get rfqTotalPriceStringIfNegotiating(): string {
        const price = this.rfqPriceAmount;
        return this.IfNegotiating(price.value + " " + price.currencyID, this.rfq.negotiationOptions.price);
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

    public get quotationWarranty(): Quantity {
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
        return UBLModelUtils.getDefaultPaymentTermsAsStrings()[0];
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

    public get quotationPaymentMeans(): string {
        return this.quotation.paymentMeans.paymentMeansCode.name;
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