import {Component, Input} from "@angular/core";
import {ReceiptAdvice} from "../../../catalogue/model/publish/receipt-advice";
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'receipt-advice',
    templateUrl: './receipt-advice.component.html'
})

export class ReceiptAdviceComponent {
    @Input() receiptAdvice:ReceiptAdvice;
}
