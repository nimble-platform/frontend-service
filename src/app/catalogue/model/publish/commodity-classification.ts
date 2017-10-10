import {Code} from "./code";
/**
 * Created by suat on 03-Jul-17.
 */
export class CommodityClassification {
    constructor(
        public itemClassificationCode: Code,
        public natureCode: Code,
        public cargoTypeCode: Code,
        public itemPropertyURI: string,
        public hjid: string
    ) { }
}