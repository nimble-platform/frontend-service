import {Clause} from "./clause";
export class Contract {
    constructor(
        public clause: Clause[] = [],
        public id:String = null
    ) {  }
}