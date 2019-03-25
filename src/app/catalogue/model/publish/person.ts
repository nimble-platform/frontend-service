/**
 * Created by suat on 01-Jun-17.
 */
import { Contact } from './contact';

export class Person {
    constructor(
        public id: string = null,
        public firstName: string = null,
        public familyName: string = null,
        public contact: Contact = new Contact(),
        public favouriteProductID: string[] = [''],
    ) {
    }
}
