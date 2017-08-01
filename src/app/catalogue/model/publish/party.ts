import {Person} from "./person";
/**
 * Created by suat on 12-May-17.
 */
export class Party {
    constructor(
        public id:string,
        public name: string,
        public person:Person
    ) {  }
}
