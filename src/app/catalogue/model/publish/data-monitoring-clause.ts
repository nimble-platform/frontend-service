import {Clause} from "./clause";
export class DataMonitoringClause extends Clause {
    constructor(
        public channelID:string = null,
    ) {
        super();
    }
}