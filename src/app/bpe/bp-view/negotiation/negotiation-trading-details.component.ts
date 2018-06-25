import { Component, Input } from "@angular/core";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import { DeliveryTerms } from "../../../catalogue/model/publish/delivery-terms";
import { PaymentTerms } from "../../../catalogue/model/publish/payment-terms";
import { PaymentMeans } from "../../../catalogue/model/publish/payment-means";

@Component({
    selector: "negotiation-trading-details",
    templateUrl: "./negotiation-trading-details.component.html"
})
export class NegotiationTradingDetailsComponent {
    @Input() presentationMode: string;
    @Input() lineItem: LineItem;
    @Input() fetchDefaultDeliveryAddress;
    @Input() paymentTerms: PaymentTerms;
    @Input() paymentMeans: PaymentMeans;
}
