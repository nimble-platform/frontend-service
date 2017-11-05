import {Person} from "./person";
import {Contact} from "./contact";
/**
 * Created by suat on 12-May-17.
 */
export class Party {
    constructor(
        public hjid = null,
        public id:string = null,
        public name: string = null,
        public contact:Contact = new Contact(),
        public person:Person[] = [new Person()]
    ) {  }
}
