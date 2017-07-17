/**
 * Created by suat on 12-May-17.
 */
import {Property} from "./property";

export class Category {
    constructor(
        public id: string,
        public preferredName: string,
        public code: string,
        public level: number,
        public definition: string,
        public note: string,
        public remark: string,
        public properties: Property[],
        public keywords: string[],
        public taxonomyId: string,
        public categoryUri: string,
    ) {  }
}
