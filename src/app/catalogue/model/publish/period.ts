/**
 * Created by deniz on 15/07/17.
 */

export class Period {
    constructor(
        public startDate: string, // TODO not sure about string for date/time
        public startTime: string,
        public endDate: string,
        public endTime: string,
        public durationMeasure: string // TODO should have been QuantityType
        // TODO left hjid out?
    ) {  }
}