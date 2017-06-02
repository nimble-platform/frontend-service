/**
 * Created by suat on 12-May-17.
 */
export class Value {
    constructor(
        public id: string,
        public preferredName: string,
        public shortName: string,
        public definition: string,
        public dataType: string,
    ) {  }
}