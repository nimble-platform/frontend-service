import {Quantity} from "./quantity";
import {Item} from "./item";
import {Price} from "./price";
import {LineReference} from "./line-reference";
import {Period} from "./period";
import {DeliveryTerms} from "./delivery-terms";
import {Delivery} from "./delivery";
import {PaymentMeans} from './payment-means';
import {PaymentTerms} from './payment-terms';
import {TradingTerm} from './trading-term';
import {Clause} from './clause';

/**
 * Created by suat on 23-Aug-17.
 */
export class LineItem {
    constructor(
        public quantity:Quantity = new Quantity(),
        public warrantyInformation:string[] = [],
        public delivery:Delivery[] = [new Delivery()],
        public deliveryTerms:DeliveryTerms = new DeliveryTerms(),
        public price:Price = new Price(),
        public item:Item = new Item(),
        public warrantyValidityPeriod:Period = new Period(),
        public lineReference:LineReference[] = [new LineReference()],
        public dataMonitoringRequested: boolean,
        public paymentMeans: PaymentMeans,
        public paymentTerms: PaymentTerms,
        public tradingTerms: TradingTerm[],
        public clause: Clause[] = [],
    ) {  }
}
