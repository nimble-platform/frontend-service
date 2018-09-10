import { PaymentTerms } from "../../catalogue/model/publish/payment-terms";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";

export class PaymentTermsWrapper {

    private PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();

    private selectedPaymentTerm: number;

    constructor(private paymentTerms: PaymentTerms) {
        const index = paymentTerms.tradingTerms.findIndex(term => term.value[0] == "true");
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

        this.paymentTerms.tradingTerms[this.selectedPaymentTerm].value[0] = "false";
        this.selectedPaymentTerm = index;
        this.paymentTerms.tradingTerms[this.selectedPaymentTerm].value[0] = "true";
    }
}