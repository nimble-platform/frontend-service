import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Amount } from "../../../catalogue/model/publish/amount";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import {copy, durationToString} from "../../../common/utils";
import { PriceWrapper } from "../../../common/price-wrapper";
import { Address } from "../../../catalogue/model/publish/address";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";
import {TradingTerm} from "../../../catalogue/model/publish/trading-term";
import {MultiTypeValue} from "../../../catalogue/model/publish/multi-type-value";
import {DiscountPriceWrapper} from "../../../common/discount-price-wrapper";
import {Clause} from "../../../catalogue/model/publish/clause";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";

const FRAME_CONTRACT_TERM_ID = "FRAME_CONTRACT_DURATION";

export class QuotationWrapper {

    paymentTermsWrapper: PaymentTermsWrapper;
    priceWrapper: PriceWrapper;

    constructor(public quotation: Quotation,
                private catalogueLine: CatalogueLine) {
        this.paymentTermsWrapper = new PaymentTermsWrapper(quotation.paymentTerms);
        this.priceWrapper = new PriceWrapper(
            quotation.quotationLine[0].lineItem.price,
            catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
            quotation.quotationLine[0].lineItem.quantity);
    }

    public get priceAmount(): Amount {
        return this.quotation.quotationLine[0].lineItem.price.priceAmount;
    }

    public get orderedQuantity(): Quantity {
        return this.quotation.quotationLine[0].lineItem.quantity;
    }

    public set orderedQuantity(quantity: Quantity) {
        this.quotation.quotationLine[0].lineItem.quantity = quantity;
    }

    public get deliveryPeriod(): Quantity {
        return this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    public get deliveryPeriodString(): string {
        return durationToString(this.deliveryPeriod);
    }

    public get warranty(): Quantity {
        return this.quotation.quotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public get warrantyString(): string {
        return durationToString(this.warranty);
    }

    public get incoterms(): string {
        return this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms;
    }

    public get incotermsString(): string {
        return this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms || "None";
    }

    public set incoterms(incoterms: string) {
        this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms = incoterms;
    }

    public get paymentMeans(): string {
        return this.quotation.paymentMeans.paymentMeansCode.value;
    }

    public set paymentMeans(paymentMeans: string) {
        this.quotation.paymentMeans.paymentMeansCode.value = paymentMeans;
    }

    public get frameContractDuration(): Quantity {
        let tradingTerm: TradingTerm = this.quotation.tradingTerms.find(tradingTerm => tradingTerm.id == FRAME_CONTRACT_TERM_ID);
        if(tradingTerm != null) {
            return tradingTerm.value.valueQuantity[0];
        }
        return null;
    }

    public get rfqFrameContractDurationString(): string {
        let duration: Quantity = this.frameContractDuration;
        if(duration != null) {
            return durationToString(duration);
        }
        return null;
    }

    public set frameContractDuration(duration: Quantity) {
        let tradingTerm: TradingTerm = this.quotation.tradingTerms.find(tradingTerm => tradingTerm.id == FRAME_CONTRACT_TERM_ID);
        if(tradingTerm == null) {
            tradingTerm = new TradingTerm(FRAME_CONTRACT_TERM_ID, null, null, new MultiTypeValue());
            tradingTerm.value.valueQuantity.push(duration)
            this.quotation.tradingTerms.push(tradingTerm);
        } else {
            tradingTerm.value.valueQuantity[0] = duration;
        }
    }

    public get dataMonitoringPromised(): boolean {
        return this.quotation.dataMonitoringPromised;
    }

    public get dataMonitoringPromisedString(): string {
        return this.quotation.dataMonitoringPromised ? "Promised" : "Not Promised";
    }

    public getTradingTerm(termName: string): TradingTerm {
        return this.quotation.tradingTerms.find(tradingTerm => tradingTerm.id == termName);
    }

    public get tradingTerms(): TradingTerm[] {
        return this.quotation.tradingTerms.filter(tradingTerm => tradingTerm.id != FRAME_CONTRACT_TERM_ID).map(tradingTerm => tradingTerm);
    }
}
