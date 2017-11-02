import {Code} from "./code";
/**
 * Created by deniz on 16/07/17.
 */

export class Country {
    constructor(
        public identificationCode: Code = new Code(),
        public name: string = '',
        public hjid: string = null
    ) {  }
}