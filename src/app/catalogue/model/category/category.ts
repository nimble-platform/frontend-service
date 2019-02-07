/**
 * Created by suat on 12-May-17.
 */
import {Property} from "./property";
import {Text} from "../publish/text";

export class Category {
    constructor(
        public id: string,
        public preferredName: Text[] = [],
        public code: string,
        public level: number,
        public definition: Text[] = [],
        public note: string,
        public remark: string,
        public properties: Property[],
        public keywords: string[],
        public taxonomyId: string,
        public categoryUri: string
    ) {  }
}
