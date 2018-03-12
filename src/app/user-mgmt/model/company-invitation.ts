export class CompanyInvitation {
    constructor(
		public companyId: string,
		public email: string,
		public roleIDs: string[]
	) {}
}