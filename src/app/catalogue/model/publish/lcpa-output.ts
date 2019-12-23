import {Quantity} from './quantity';
import {Amount} from './amount';

export class LCPAOutput {
    constructor(
        public globalWarmingPotential: Quantity = new Quantity(),
        public cumulativeEnergyDemand: Quantity = new Quantity(),
        public aerosolFormationPotential: Quantity = new Quantity(),
        public acidificationPotential: Quantity = new Quantity(),
        public eutrophicationPotential: Quantity = new Quantity(),
        public opex: Amount = new Amount(),
        public lifeCycleCost: Amount = new Amount(),
        public capex: Amount = new Amount()
    ) {  }
}
