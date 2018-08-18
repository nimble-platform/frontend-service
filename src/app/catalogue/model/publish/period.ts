import {Quantity} from "./quantity";
/**
 * Created by deniz on 15/07/17.
 */

export class Period {
    constructor(
        public startDate: string = null, // TODO not sure about string for date/time
        public startTime: string = null,
        public endDate: string = null,
        public endTime: string = null,
        public durationMeasure: Quantity = new Quantity(null, "working days", null),
        public hjid: string = null
    ) {  }
}