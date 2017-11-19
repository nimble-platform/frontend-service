import {SalesItem} from "./sales-item";
export class ItemInformationRequestLine {
    constructor(
        public salesItem:SalesItem[] = [new SalesItem()]
    ) {  }
}
