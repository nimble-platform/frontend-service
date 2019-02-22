import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Amount } from "../../../catalogue/model/publish/amount";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { durationToString } from "../../../common/utils";
import { PriceWrapper } from "../../../common/price-wrapper";
import { Address } from "../../../catalogue/model/publish/address";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";

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
                public quotation: Quotation,
                public settings: CompanyNegotiationSettings) {

        this.rfqPaymentTerms = new PaymentTermsWrapper(rfq.paymentTerms);
        if(quotation) {
            this.quotationPaymentTerms = new PaymentTermsWrapper(quotation.paymentTerms);
        }

        this.linePriceWrapper = new PriceWrapper(
            line.requiredItemLocationQuantity.price,
            rfq.requestForQuotationLine[0].lineItem.quantity,
            line.priceOption,
            rfq.requestForQuotationLine[0].lineItem.item.additionalItemProperty
        );
        this.rfqPriceWrapper = new PriceWrapper(
            rfq.requestForQuotationLine[0].lineItem.price,
            rfq.requestForQuotationLine[0].lineItem.quantity,
            line.priceOption,
            rfq.requestForQuotationLine[0].lineItem.item.additionalItemProperty
        )
        if(quotation) {
            this.quotationPriceWrapper = new PriceWrapper(
                line.requiredItemLocationQuantity.price,
                quotation.quotationLine[0].lineItem.quantity,
                line.priceOption,
                rfq.requestForQuotationLine[0].lineItem.item.additionalItemProperty,
                rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms,
                rfq.paymentMeans.paymentMeansCode.value,
                rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure,
                rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address,
                quotation.quotationLine[0].lineItem.price
            );
        }
    }

    public get linePricePerItemString(): string {
        this.updateLinePriceWrapperFields();
        return this.linePriceWrapper.pricePerItemString;
    }

    public get lineTotalPrice(): number {
        return this.linePriceWrapper.totalPrice;
    }

    public get lineTotalPriceString(): string {
        this.updateLinePriceWrapperFields();
        return this.linePriceWrapper.totalPriceString;
    }

    // before calculating total price for line, we have to update linePriceWrapper fields so that it can calculate discount amount correctly
    private updateLinePriceWrapperFields(){
        this.linePriceWrapper.incoterm = this.rfq.negotiationOptions.incoterms ? this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms : this.line.goodsItem.deliveryTerms.incoterms;
        this.linePriceWrapper.paymentMeans = this.rfq.negotiationOptions.paymentMeans ? this.rfq.paymentMeans.paymentMeansCode.value : this.settings.paymentMeans[0];
        this.linePriceWrapper.deliveryPeriod = this.rfq.negotiationOptions.deliveryPeriod ? JSON.parse(JSON.stringify(this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure)): this.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;
        this.linePriceWrapper.deliveryLocation = this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
    }

    public get rfqPricePerItemString(): string {
        return this.rfqPriceWrapper.pricePerItemString;
    }

    public get rfqPricePerItemStringIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPriceWrapper.pricePerItemString, this.rfq.negotiationOptions.price);
    }

    public get rfqTotalPrice(): number {
        return this.rfqPriceWrapper.totalPrice;
    }

    public get rfqTotalPriceString(): string {
        this.updateRFQPriceWrapperFields()
        return this.rfqPriceWrapper.totalPriceString;
    }

    public get rfqTotalPriceStringIfNegotiating(): string {
        this.updateRFQPriceWrapperFields();
        return this.IfNegotiating(this.rfqPriceWrapper.totalPriceString, this.rfq.negotiationOptions.price);
    }

    // before calculating total price for rfq, we have to update rfqPriceWrapper fields so that it can calculate discount amount correctly
    private updateRFQPriceWrapperFields(){
        this.rfqPriceWrapper.incoterm = this.rfq.negotiationOptions.incoterms ? this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms : this.line.goodsItem.deliveryTerms.incoterms;
        this.rfqPriceWrapper.paymentMeans = this.rfq.negotiationOptions.paymentMeans ? this.rfq.paymentMeans.paymentMeansCode.value : this.settings.paymentMeans[0];
        this.rfqPriceWrapper.deliveryPeriod = this.rfq.negotiationOptions.deliveryPeriod ? JSON.parse(JSON.stringify(this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure)): this.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;
        this.rfqPriceWrapper.deliveryLocation = this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.deliveryLocation.address;
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
        return durationToString(this.lineDeliveryPeriod);
    }

    public get rfqDeliveryPeriod(): Quantity {
        return this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    public get rfqDeliveryPeriodString(): string {
        return durationToString(this.rfqDeliveryPeriod);
    }

    public get rfqDeliveryPeriodStringIfNegotiating(): string {
        return this.durationToStringIfNegotiating(this.rfqDeliveryPeriod, this.rfq.negotiationOptions.deliveryPeriod);
    }

    public get quotationDeliveryPeriod(): Quantity {
        // update quotation delivery period to calculate price correctly
        if(this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.value && (
                this.quotationPriceWrapper.deliveryPeriod.value != this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.value ||
                this.quotationPriceWrapper.deliveryPeriod.unitCode != this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.unitCode)){

            this.quotationPriceWrapper.deliveryPeriod = JSON.parse(JSON.stringify(this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure));
            // make this field true so that quotation price will be updated
            this.quotationPriceWrapper.quotationDeliveryPeriodUpdated = true;
        }
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
        return this.durationToStringIfNegotiating(this.rfqWarranty, this.rfq.negotiationOptions.warranty);
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
        // update quotation incoterm to calculate price correctly
        if(this.quotationPriceWrapper.incoterm != this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms){
            this.quotationPriceWrapper.incoterm = this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms;
            // make this field true so that quotation price will be updated
            this.quotationPriceWrapper.quotationIncotermUpdated = true;
        }

        return this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms;
    }

    public set quotationIncoterms(incoterms: string) {
        this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms = incoterms;
    }

    public get linePaymentTerms(): string {
        return this.settings.paymentTerms[0];
    }

    public get rfqPaymentTermsToString(): string {
        return this.rfqPaymentTerms.paymentTerm;
    }

    public get rfqPaymentTermsIfNegotiating(): string {
        return this.IfNegotiating(this.rfqPaymentTerms.paymentTerm, this.rfq.negotiationOptions.paymentTerms);
    }

    public get linePaymentMeans(): string {
        return this.settings.paymentMeans[0];
    }

    public get rfqPaymentMeans(): string {
        return this.rfq.paymentMeans.paymentMeansCode.value;
    }

    public set rfqPaymentMeans(paymentMeans: string) {
        this.rfq.paymentMeans.paymentMeansCode.value = paymentMeans;
    }

    public get quotationPaymentMeans(): string {
        // update quotation payment means to calculate quotation price correctly
        if(this.quotationPriceWrapper.paymentMeans !=  this.quotation.paymentMeans.paymentMeansCode.value){
            this.quotationPriceWrapper.paymentMeans = this.quotation.paymentMeans.paymentMeansCode.value;
            // make this field true so that quotation price will be updated
            this.quotationPriceWrapper.quotationPaymentMeansUpdated = true;
        }
        return this.quotation.paymentMeans.paymentMeansCode.value;
    }

    public set quotationPaymentMeans(paymentMeans: string) {
        this.quotation.paymentMeans.paymentMeansCode.value = paymentMeans;
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
