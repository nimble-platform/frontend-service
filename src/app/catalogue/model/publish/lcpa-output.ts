import {Quantity} from './quantity';
import {Amount} from './amount';

export class LCPAOutput {
    constructor(
        public capexOpexRelation: Quantity = new Quantity(),
        public lifeCycleCost: Amount = new Amount(),
        public operationCostsPerYear: Amount = new Amount()
    ) {  }
}
