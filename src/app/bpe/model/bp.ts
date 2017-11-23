import {Transaction} from './transaction';

export class BP {

    constructor(public processID: string,
                public processName: string,
                public processType: string,
                public textContent: string,
                public bpmnContent: string,
                public transactions: Transaction[]) {

    }
}
