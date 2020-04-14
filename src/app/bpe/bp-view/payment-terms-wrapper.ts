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

import { PaymentTerms } from "../../catalogue/model/publish/payment-terms";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";

export class PaymentTermsWrapper {

    private PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();

    private selectedPaymentTerm: number;

    constructor(private paymentTerms: PaymentTerms) {
        const index = paymentTerms.tradingTerms.findIndex(term => term.value.value[0].value == "true");
        this.selectedPaymentTerm = index < 0 ? 0 : index;
    }

    get paymentTerm(): string {
        return this.PAYMENT_TERMS[this.selectedPaymentTerm];
    }

    set paymentTerm(paymentTerm: string) {
        const index = this.PAYMENT_TERMS.findIndex(term => term === paymentTerm);
        if (index < 0) {
            return;
        }

        this.paymentTerms.tradingTerms[this.selectedPaymentTerm].value.value[0].value = "false";
        this.selectedPaymentTerm = index;
        this.paymentTerms.tradingTerms[this.selectedPaymentTerm].value.value[0].value = "true";

        this.paymentTerms.tradingTerms = [].concat(this.paymentTerms.tradingTerms);
    }

    getDefaultPaymentTerms() {
        return this.PAYMENT_TERMS[0];
    }
}
