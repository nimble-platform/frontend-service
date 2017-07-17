import { Address } from './address';
/**
 * Created by jinnerbi on 03/07/17.
 */

export class DeliveryTerms {
    constructor(
        public specialTerms: string,
        public deliveryAddress: Address,
        public estimatedDeliveryTime: number,
    ) {  }
}
