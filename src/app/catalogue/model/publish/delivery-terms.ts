import {Amount} from "./amount";
import {Location} from "./location";
import {Period} from "./period";
import {Text} from "./text";
/**
 * Created by deniz on 16/07/17.
 */

export class DeliveryTerms {
    constructor(
        public id: string = null,
        public estimatedDeliveryPeriod:Period = new Period(),
        public specialTerms: Text[] = [],
        public incoterms: string = null,
        public amount: Amount = new Amount(),
        public deliveryLocation:Location = new Location(),
        public hjid: string = null
    ) {  }

    selectSpecialTerms(languageID: string): string {
        for (let pName of this.specialTerms) {
            if(pName.languageID === languageID) {
                return pName.value;
            }
        }

        return this.specialTerms[0].value;
    }
}