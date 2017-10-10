import {ExecutionConfiguration} from './execution-configuration';

export class TransactionConfiguration {
    constructor(public transactionID: string,
                public executionConfigurations: ExecutionConfiguration[]) {

    }
}
