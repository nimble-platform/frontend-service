/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Amount } from "../../../catalogue/model/publish/amount";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { durationToString} from "../../../common/utils";
import { PriceWrapper } from "../../../common/price-wrapper";
import {TradingTerm} from "../../../catalogue/model/publish/trading-term";
import {MultiTypeValue} from "../../../catalogue/model/publish/multi-type-value";
import {Delivery} from '../../../catalogue/model/publish/delivery';

const FRAME_CONTRACT_TERM_ID = "FRAME_CONTRACT_DURATION";

export class QuotationWrapper {

    paymentTermsWrapper: PaymentTermsWrapper;
    priceWrapper: PriceWrapper;

    constructor(public quotation: Quotation,
                private catalogueLine: CatalogueLine,
                public quotationLineIndex:number=0) {
        this.paymentTermsWrapper = new PaymentTermsWrapper(quotation.quotationLine[quotationLineIndex].lineItem.paymentTerms);
        this.priceWrapper = new PriceWrapper(
            quotation.quotationLine[this.quotationLineIndex].lineItem.price,
            catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
            quotation.quotationLine[this.quotationLineIndex].lineItem.quantity);
    }

    public get priceAmount(): Amount {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.price.priceAmount;
    }

    public get orderedQuantity(): Quantity {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.quantity;
    }

    public set orderedQuantity(quantity: Quantity) {
        this.quotation.quotationLine[this.quotationLineIndex].lineItem.quantity = quantity;
    }

    public get deliveryPeriod(): Quantity {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    public get delivery(): Delivery[] {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.delivery;
    }

    public get deliveryPeriodString(): string {
        return durationToString(this.deliveryPeriod);
    }

    public get warranty(): Quantity {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.warrantyValidityPeriod.durationMeasure;
    }

    public get warrantyString(): string {
        return durationToString(this.warranty);
    }

    public get incoterms(): string {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.deliveryTerms.incoterms;
    }

    public get incotermsString(): string {
        let incoterms = this.quotation.quotationLine[this.quotationLineIndex].lineItem.deliveryTerms.incoterms;
        if(incoterms == null || incoterms == ""){
            return "None";
        }
        return incoterms;
    }

    public set incoterms(incoterms: string) {
        this.quotation.quotationLine[this.quotationLineIndex].lineItem.deliveryTerms.incoterms = incoterms;
    }

    public get paymentMeans(): string {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.paymentMeans.paymentMeansCode.value;
    }

    public set paymentMeans(paymentMeans: string) {
        this.quotation.quotationLine[this.quotationLineIndex].lineItem.paymentMeans.paymentMeansCode.value = paymentMeans;
    }

    public get frameContractDuration(): Quantity {
        let tradingTerm: TradingTerm = this.quotation.quotationLine[this.quotationLineIndex].lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == FRAME_CONTRACT_TERM_ID);
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
        let tradingTerm: TradingTerm = this.quotation.quotationLine[this.quotationLineIndex].lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == FRAME_CONTRACT_TERM_ID);
        if(tradingTerm == null) {
            tradingTerm = new TradingTerm(FRAME_CONTRACT_TERM_ID, null, null, new MultiTypeValue());
            tradingTerm.value.valueQuantity.push(duration)
            this.quotation.quotationLine[this.quotationLineIndex].lineItem.tradingTerms.push(tradingTerm);
        } else {
            tradingTerm.value.valueQuantity[0] = duration;
        }
    }

    public get dataMonitoringPromised(): boolean {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.dataMonitoringRequested;
    }

    public get dataMonitoringPromisedString(): string {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.dataMonitoringRequested ? 'Confirmed' : 'Not Confirmed';
    }

    public getTradingTerm(termName: string): TradingTerm {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.tradingTerms.find(tradingTerm => tradingTerm.id == termName);
    }

    public get tradingTerms(): TradingTerm[] {
        return this.quotation.quotationLine[this.quotationLineIndex].lineItem.tradingTerms.filter(tradingTerm => tradingTerm.id != FRAME_CONTRACT_TERM_ID).map(tradingTerm => tradingTerm);
    }
}
