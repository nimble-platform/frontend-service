import { Address } from './address';
/**
 * Created by jinnerbi on 03/07/17.
 */

export class DeliveryTerms {
    constructor(
        public specialTerms: Object = {}, // languageId-value pairs. For example, {en:"some special terms here"}
        public deliveryAddress: Address,
        public estimatedDeliveryTime: number,
    ) {  }
}
