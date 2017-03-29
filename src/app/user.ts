export class User {
	constructor(
		public firstname: string,
		public lastname: string,
		public jobTitle: string,
		public email: string,
		public dateOfBirth: string,
		public placeOfBirth: string,
		public legalDomain: string,
		public phoneNumber: string,
		public password: string,
		/* ToDo: Hackathon only BEGIN */
		public companyName: string,
		public companyAddress: string,
		public companyCountry: string
		/* ToDo: Hackathon only END */
	) {  }
}