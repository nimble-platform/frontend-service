export class RequestForQuotation {
	constructor(
		public seller: string,
		public sellerName: string,
		public buyer: string,
		public buyerName: string,
		public connection: string,
		public terms: string,
		public rfqResponse: string
	) {  }
}