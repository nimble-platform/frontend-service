import { PaymentTerms } from "../../catalogue/model/publish/payment-terms";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";
import {TradingTerm} from '../../catalogue/model/publish/trading-term';

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
        if(index < 0) {
            return;
        }

        this.paymentTerms.tradingTerms[this.selectedPaymentTerm].value.value[0].value = "false";
        this.selectedPaymentTerm = index;
        this.paymentTerms.tradingTerms[this.selectedPaymentTerm].value.value[0].value = "true";

        this.paymentTerms.tradingTerms = [].concat(this.paymentTerms.tradingTerms);
    }

    get tradingTerms():TradingTerm[]{
        return this.paymentTerms.tradingTerms;
    }
}
