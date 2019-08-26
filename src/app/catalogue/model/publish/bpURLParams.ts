export class BpURLParams{
    constructor(
        public catalogueId = null,
        public catalogueLineId = null,
        public processInstanceId = null,
        public previousDocumentId = null,
        public termsSource: 'product_defaults' | 'frame_contract' = null
    ){}
}