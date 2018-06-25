import { PaymentTerms } from "../../catalogue/model/publish/payment-terms";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";

export class PaymentTermsWrapper {

    public PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();

    private selectedPaymentTerm: number = 0;

    constructor(private paymentTerms: PaymentTerms) {

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