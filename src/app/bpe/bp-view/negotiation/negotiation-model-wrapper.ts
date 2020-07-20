/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { copy, durationToString, roundToTwoDecimals } from "../../../common/utils";
import { Address } from "../../../catalogue/model/publish/address";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";
import { TradingTerm } from "../../../catalogue/model/publish/trading-term";
import { MultiTypeValue } from "../../../catalogue/model/publish/multi-type-value";
import { DiscountPriceWrapper } from "../../../common/discount-price-wrapper";
import { QuotationWrapper } from "./quotation-wrapper";
import { Text } from "../../../catalogue/model/publish/text";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { FRAME_CONTRACT_DURATION_TERM_NAME } from '../../../common/constants';
import { Delivery } from '../../../catalogue/model/publish/delivery';

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
        public sellerSettings: CompanyNegotiationSettings,
        public lineIndex: number // line index is required in case the same product is included in the rfq multiple times
    ) {

        this.initialImmutableRfq = copy(rfq);
        this.rfqPaymentTerms = new PaymentTermsWrapper(rfq.requestForQuotationLine[lineIndex].lineItem.paymentTerms);


        if (catalogueLine) {
            this.initialImmutableCatalogueLine = copy(catalogueLine);
        }

        // discount price wrappers
        if (catalogueLine && rfq) {
            // first construct wrappers
            this.lineDiscountPriceWrapper = new DiscountPriceWrapper(
                catalogueLine.requiredItemLocationQuantity.price,
                copy(catalogueLine.requiredItemLocationQuantity.price), // we don't want the original catalogueLine.requiredItemLocationQuantity.price to be updated in price changes
                catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.quantity,
                catalogueLine.priceOption,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.item.additionalItemProperty,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.incoterms,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.paymentMeans.paymentMeansCode.value,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.deliveryLocation.address,
                catalogueLine.priceHidden
                //null,
                //true // disable calculation of discounts
            );
            this.rfqDiscountPriceWrapper = new DiscountPriceWrapper(
                catalogueLine.requiredItemLocationQuantity.price,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.price,
                catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.quantity,
                catalogueLine.priceOption,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.item.additionalItemProperty,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.incoterms,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.paymentMeans.paymentMeansCode.value,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure,
                rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.deliveryLocation.address
            );

            if (newQuotation) {
                this.quotationDiscountPriceWrapper = new DiscountPriceWrapper(
                    catalogueLine.requiredItemLocationQuantity.price,
                    newQuotation.quotationLine[this.lineIndex].lineItem.price,
                    catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
                    newQuotation.quotationLine[this.lineIndex].lineItem.quantity,
                    catalogueLine.priceOption,
                    rfq.requestForQuotationLine[this.lineIndex].lineItem.item.additionalItemProperty,
                    rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.incoterms,
                    rfq.requestForQuotationLine[this.lineIndex].lineItem.paymentMeans.paymentMeansCode.value,
                    rfq.requestForQuotationLine[this.lineIndex].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure,
                    rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.deliveryLocation.address
                );
            }
        }

        if (newQuotation) {
            this.newQuotationWrapper = new QuotationWrapper(newQuotation, catalogueLine, this.lineIndex);
        }

        if (frameContractQuotation) {
            // we can not use this.lineIndex to create a QuotationWrapper for frame contract since there may be different products in frame contract quotation
            let frameContractQuotationLineIndex = UBLModelUtils.getFrameContractQuotationLineIndexForProduct(frameContractQuotation.quotationLine, catalogueLine.goodsItem.item.catalogueDocumentReference.id, catalogueLine.goodsItem.item.manufacturersItemIdentification.id);
            this.frameContractQuotationWrapper = new QuotationWrapper(frameContractQuotation, catalogueLine, frameContractQuotationLineIndex);
        }

        if (lastOfferQuotation) {
            this.lastOfferQuotationWrapper = new QuotationWrapper(lastOfferQuotation, catalogueLine, this.lineIndex);
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

    public get lineIncotermsString(): string {
        let incoterms = this.catalogueLine.goodsItem.deliveryTerms.incoterms;
        if (incoterms == null || incoterms == "") {
            return "None";
        }
        return incoterms;
    }

    public get linePaymentTerms(): string {
        return this.sellerSettings.paymentTerms[0];
    }

    public get linePaymentMeans(): string {
        return this.sellerSettings.paymentMeans[0];
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

    /**
     * Rfq methods
     */

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
        let rfqVatTotal = this.rfqVatTotal;
        if (rfqVatTotal == 0) {
            return "On demand";
        }
        return `${roundToTwoDecimals(rfqVatTotal)} ${this.rfqDiscountPriceWrapper.itemPrice.currency}`
    }

    public get rfqGrossTotal(): number {
        return this.rfqDiscountPriceWrapper.totalPrice + this.rfqVatTotal;
    }

    public get rfqTotal(): number {
        return this.rfqDiscountPriceWrapper.totalPrice;
    }

    public get currency(): string {
        return this.rfqDiscountPriceWrapper.itemPrice.currency;
    }

    public get rfqGrossTotalString(): string {
        let rfqGrossTotal = this.rfqGrossTotal;
        if (rfqGrossTotal == 0) {
            return "On demand";
        }
        return `${roundToTwoDecimals(this.rfqGrossTotal)} ${this.rfqDiscountPriceWrapper.itemPrice.currency}`
    }

    public get rfqDeliveryPeriod(): Quantity {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    public set rfqDeliveryPeriod(quantity: Quantity) {
        this.rfq.requestForQuotationLine[this.lineIndex].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure = quantity;
    }

    public get rfqDelivery(): Delivery[] {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.delivery;
    }

    public get rfqDeliveryPeriodString(): string {
        return durationToString(this.rfqDeliveryPeriod);
    }

    public get rfqWarranty(): Quantity {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public set rfqWarranty(quantity: Quantity) {
        this.rfq.requestForQuotationLine[this.lineIndex].lineItem.warrantyValidityPeriod.durationMeasure = quantity;
    }

    public get rfqQuantity(): Quantity {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.quantity;
    }

    public get rfqWarrantyString(): string {
        return durationToString(this.rfqWarranty);
    }

    public get rfqIncoterms(): string {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.incoterms;
    }

    public set rfqIncoterms(incoterms: string) {
        this.rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.incoterms = incoterms;
    }

    public get rfqIncotermsString(): string {
        let incoterms = this.rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.incoterms;
        if (incoterms == null || incoterms == "") {
            return "None";
        }
        return incoterms;
    }

    public get rfqPaymentTermsToString(): string {
        return this.rfqPaymentTerms.paymentTerm;
    }

    public get rfqDataMonitoringRequested(): boolean {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.dataMonitoringRequested;
    }

    public set rfqDataMonitoringRequested(isDataMonitoringRequested: boolean) {
        this.rfq.requestForQuotationLine[this.lineIndex].lineItem.dataMonitoringRequested = isDataMonitoringRequested;
    }

    public get rfqPaymentMeans(): string {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.paymentMeans.paymentMeansCode.value;
    }

    public set rfqPaymentMeans(paymentMeans: string) {
        this.rfq.requestForQuotationLine[this.lineIndex].lineItem.paymentMeans.paymentMeansCode.value = paymentMeans;
    }

    public get rfqFrameContractDuration(): Quantity {
        let tradingTerm: TradingTerm = this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if (tradingTerm != null) {
            return tradingTerm.value.valueQuantity[0];
        }
        return null;
    }

    public set rfqFrameContractDuration(duration: Quantity) {
        let tradingTerm: TradingTerm = this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if (tradingTerm == null) {
            tradingTerm = new TradingTerm(FRAME_CONTRACT_DURATION_TERM_NAME, null, null, new MultiTypeValue());
            tradingTerm.value.valueQuantity.push(duration)
            this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.push(tradingTerm);
        } else {
            tradingTerm.value.valueQuantity[0] = duration;
        }
    }

    // get trading terms except the one representing frame contract duration
    public get rfqTradingTerms(): TradingTerm[] {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.filter(tradingTerm => tradingTerm.id != "FRAME_CONTRACT_DURATION").map(tradingTerm => tradingTerm);
    }

    // set trading terms except the one representing frame contract duration
    public set rfqTradingTerms(tradingTerms: TradingTerm[]) {
        let frameContractDuration: TradingTerm = this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if (frameContractDuration) {
            tradingTerms.push(frameContractDuration);
        }
        this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms = tradingTerms;
    }

    public getRfqTradingTerm(termName: string): TradingTerm {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == termName);
    }

    public addRfqTradingTerm(termName: string, termDescription: string, value, type: string): void {
        let tradingTerm: TradingTerm = this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == termName);
        if (tradingTerm != null) {
            return;
        } else {
            tradingTerm = UBLModelUtils.createTradingTerm(termName, termDescription, value, type);
            this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.push(tradingTerm);
        }
    }

    public deleteRfqTradingTerm(termName: string): void {
        let indexToRemove = this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.findIndex(term => term.id === termName);
        if (indexToRemove != -1) {
            this.rfq.requestForQuotationLine[this.lineIndex].lineItem.tradingTerms.splice(indexToRemove, 1);
        }
    }

    public get rfqDeliveryAddress(): Address {
        return this.rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.deliveryLocation.address;
    }

    public set rfqDeliveryAddress(address: Address) {
        this.rfq.requestForQuotationLine[this.lineIndex].lineItem.deliveryTerms.deliveryLocation.address = address;
    }

    // compares the default terms of product and the terms specified in the request
    public checkEqualForRequest(termsSource: 'product_defaults' | 'frame_contract' | 'last_offer', part): boolean {
        switch (part) {
            case "deliveryPeriod":
                if (termsSource == "product_defaults")
                    return (this.rfqDeliveryPeriodString == this.lineDeliveryPeriodString);
                else if (termsSource == "frame_contract")
                    return (this.rfqDeliveryPeriodString == this.frameContractQuotationWrapper.deliveryPeriodString);
                else if (termsSource == "last_offer")
                    return (this.rfqDeliveryPeriodString == this.lastOfferQuotationWrapper.deliveryPeriodString);
                break;
            case "warranty":
                if (termsSource == "product_defaults")
                    return (this.rfqWarrantyString == this.lineWarrantyString);
                else if (termsSource == "frame_contract")
                    return (this.rfqWarrantyString == this.frameContractQuotationWrapper.warrantyString);
                else if (termsSource == "last_offer")
                    return (this.rfqWarrantyString == this.lastOfferQuotationWrapper.warrantyString);
                break;
            case "incoTerms":
                if (termsSource == "product_defaults")
                    return (this.rfqIncotermsString == this.lineIncotermsString);
                else if (termsSource == "frame_contract")
                    return (this.rfqIncotermsString == this.frameContractQuotationWrapper.incotermsString);
                else if (termsSource == "last_offer")
                    return (this.rfqIncotermsString == this.lastOfferQuotationWrapper.incotermsString);
                break;
            case "paymentTerms":
                if (termsSource == "product_defaults")
                    return (this.rfqPaymentTerms.paymentTerm == this.linePaymentTerms);
                else if (termsSource == "frame_contract")
                    return (this.rfqPaymentTerms.paymentTerm == this.frameContractQuotationWrapper.paymentTermsWrapper.paymentTerm);
                else if (termsSource == "last_offer")
                    return (this.rfqPaymentTerms.paymentTerm == this.lastOfferQuotationWrapper.paymentTermsWrapper.paymentTerm);
                break;
            case "paymentMeans":
                if (termsSource == "product_defaults")
                    return (this.rfqPaymentMeans == this.linePaymentMeans);
                else if (termsSource == "frame_contract")
                    return (this.rfqPaymentMeans == this.frameContractQuotationWrapper.paymentMeans);
                else if (termsSource == "last_offer")
                    return (this.rfqPaymentMeans == this.lastOfferQuotationWrapper.paymentMeans);
                break;
            case "quantity":
                if (termsSource == "product_defaults")
                    return true;
                else if (termsSource == "frame_contract")
                    return (this.rfq.requestForQuotationLine[this.lineIndex].lineItem.quantity.value == this.frameContractQuotationWrapper.orderedQuantity.value);
                else if (termsSource == "last_offer")
                    return (this.rfq.requestForQuotationLine[this.lineIndex].lineItem.quantity.value == this.lastOfferQuotationWrapper.orderedQuantity.value);
                break;
            case "price":
                if (termsSource == "product_defaults")
                    return (this.rfqPricePerItemString == this.lineDiscountPriceWrapper.discountedPricePerItemString);
                else if (termsSource == "frame_contract")
                    return (this.rfqPricePerItemString == this.frameContractQuotationWrapper.priceWrapper.pricePerItemString);
                else if (termsSource == "last_offer")
                    return (this.rfqPricePerItemString == this.lastOfferQuotationWrapper.priceWrapper.pricePerItemString);
                break;
            case "dataMonitoring":
                if (termsSource == "product_defaults")
                    return !this.rfqDataMonitoringRequested;
                else if (termsSource == "frame_contract")
                    return (this.rfqDataMonitoringRequested == this.frameContractQuotationWrapper.dataMonitoringPromised);
                else if (termsSource == "last_offer")
                    return (this.rfqDataMonitoringRequested == this.lastOfferQuotationWrapper.dataMonitoringPromised);
                break;
            default:
                return true;
        }
    }

    // compares the terms specified in the request and the ones in the response
    public checkEqualForResponse(part): boolean {
        switch (part) {
            case "deliveryPeriod":
                return (this.rfqDeliveryPeriodString == this.newQuotationWrapper.deliveryPeriodString);
            case "warranty":
                return (this.rfqWarrantyString == this.newQuotationWrapper.warrantyString);
            case "incoTerms":
                return (this.rfqIncotermsString == this.newQuotationWrapper.incotermsString);
            case "paymentTerms":
                return (this.rfqPaymentTerms.paymentTerm == this.newQuotationWrapper.paymentTermsWrapper.paymentTerm);
            case "paymentMeans":
                return (this.rfqPaymentMeans == this.newQuotationWrapper.paymentMeans);
            case "price":
                return (this.rfqPricePerItemString == this.newQuotationWrapper.priceWrapper.pricePerItemString);
            case "dataMonitoring":
                return this.rfqDataMonitoringRequested == this.newQuotationWrapper.dataMonitoringPromised;
            case "frameContract":
                return UBLModelUtils.areQuantitiesEqual(this.rfqFrameContractDuration, this.newQuotationWrapper.frameContractDuration);
            case "quantity":
                return UBLModelUtils.areQuantitiesEqual(this.rfqQuantity, this.newQuotationWrapper.orderedQuantity);
            default:
                return true;
        }
    }

    checkTermEquivalance(termsSource: 'product_defaults' | 'frame_contract' | 'last_offer', termId: string): boolean {
        if (termsSource == "product_defaults") {
            return false;
        }
        let rfqTerm = this.getRfqTradingTerm(termId);
        let otherTerm;

        if (termsSource == "frame_contract") {
            otherTerm = this.frameContractQuotationWrapper.getTradingTerm(termId);
        } else if (termsSource == "last_offer") {
            otherTerm = this.lastOfferQuotationWrapper.getTradingTerm(termId);
        }
        return UBLModelUtils.areTradingTermsEqual(rfqTerm, otherTerm);
    }
}
