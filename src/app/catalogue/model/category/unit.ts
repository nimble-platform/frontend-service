/**
 * Created by suat on 12-May-17.
 */
export class Unit {
    constructor(
        public id: string,
        public structuredName: string,
        public shortName: string,
        public definition: string,
        public source: string,
        public comment: string,
        public siNotation: string,
        public siName: string,
        public dinNotation: string,
        public eceName: string,
        public eceCode: string,
        public nistName: string,
        public iecClassification: string,
        public nameOfDedicatedQuantity: string
    ) {  }
}