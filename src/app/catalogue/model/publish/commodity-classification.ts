import {Code} from "./code";
/**
 * Created by suat on 03-Jul-17.
 */
export class CommodityClassification {
    constructor(
        public itemClassificationCode: Code = new Code(),
        public natureCode: Code = new Code(),
        public cargoTypeCode: Code = new Code(),
        public hjid: string = null
    ) { }
}
