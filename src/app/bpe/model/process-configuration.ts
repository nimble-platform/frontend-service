import {TransactionConfiguration} from './transaction-configuration';

export class ProcessConfiguration {
    constructor(public partnerID: string,
                public roleType: string,
                public processID: string,
                public transactionConfigurations: TransactionConfiguration[]) {

    }
}
