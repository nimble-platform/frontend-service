export class Order {
	constructor(
		public amount: string,
		public message: string,
		public product_id: string,
		public product_name: string
	) {  }
}