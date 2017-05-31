export class Order {
	constructor(
		public seller: string,
		public buyer: string,
		public connection: string,
		public order: {
			amount: string,
			message: string,
			product_id: string,
			product_name: string,
		}
	) {  }
}