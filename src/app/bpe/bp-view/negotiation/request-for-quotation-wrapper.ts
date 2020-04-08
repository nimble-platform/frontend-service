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

// import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
// import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
// import { Amount } from "../../../catalogue/model/publish/amount";
// import { Quantity } from "../../../catalogue/model/publish/quantity";
// import { PaymentTermsWrapper } from "../payment-terms-wrapper";
// import { durationToString} from "../../../common/utils";
// import { PriceWrapper } from "../../../common/price-wrapper";
// import {TradingTerm} from "../../../catalogue/model/publish/trading-term";
// import {MultiTypeValue} from "../../../catalogue/model/publish/multi-type-value";
//
// export class RequestForQuotationWrapper {
//
//     paymentTermsWrapper: PaymentTermsWrapper;
//     priceWrapper: PriceWrapper;
//
//     constructor(private requestForQuotation: RequestForQuotation,
//                 private catalogueLine: CatalogueLine) {
//         this.paymentTermsWrapper = new PaymentTermsWrapper(requestForQuotation.paymentTerms);
//         this.priceWrapper = new PriceWrapper(
//             requestForQuotation.requestForQuotationLine[0].lineItem.price,
//             catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
//             requestForQuotation.requestForQuotationLine[0].lineItem.quantity);
//     }
//
//     public get priceAmount(): Amount {
//         return this.requestForQuotation.requestForQuotationLine[0].lineItem.price.priceAmount;
//     }
//
//     public get orderedQuantity(): Quantity {
//         return this.requestForQuotation.requestForQuotationLine[0].lineItem.quantity;
//     }
//
//     public get deliveryPeriod(): Quantity {
//         return this.requestForQuotation.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure;
//     }
//
//     public get deliveryPeriodString(): string {
//         return durationToString(this.deliveryPeriod);
//     }
//
//     public get warranty(): Quantity {
//         return this.requestForQuotation.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure;
//     }
//
//     public get warrantyString(): string {
//         return durationToString(this.warranty);
//     }
//
//     public get incoterms(): string {
//         return this.requestForQuotation.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms;
//     }
//
//     public get incotermsString(): string {
//         return this.requestForQuotation.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms || "None";
//     }
//
//     public set incoterms(incoterms: string) {
//         this.requestForQuotation.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms = incoterms;
//     }
//
//     public get paymentMeans(): string {
//         return this.requestForQuotation.paymentMeans.paymentMeansCode.value;
//     }
//
//     public set paymentMeans(paymentMeans: string) {
//         this.requestForQuotation.paymentMeans.paymentMeansCode.value = paymentMeans;
//     }
//
//     public get frameContractDuration(): Quantity {
//         let tradingTerm: TradingTerm = this.requestForQuotation.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
//         if(tradingTerm != null) {
//             return tradingTerm.value.valueQuantity[0];
//         }
//         return null;
//     }
//
//     public set frameContractDuration(duration: Quantity) {
//         let tradingTerm: TradingTerm = this.requestForQuotation.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
//         if(tradingTerm == null) {
//             tradingTerm = new TradingTerm("FRAME_CONTRACT_DURATION", null, null, new MultiTypeValue());
//             tradingTerm.value.valueQuantity.push(duration)
//             this.requestForQuotation.tradingTerms.push(tradingTerm);
//         } else {
//             tradingTerm.value.valueQuantity[0] = duration;
//         }
//     }
// }
