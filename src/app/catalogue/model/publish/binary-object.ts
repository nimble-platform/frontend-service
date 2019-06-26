/**
 * Created by suat on 12-May-17.
 */

export class BinaryObject {
    constructor(
        public value: string,
        public mimeCode: string,
        public fileName: string,
        public uri: string,
        public languageID: string,

        // for demo
        public objectMetadata:string,
    ) {  }
}
