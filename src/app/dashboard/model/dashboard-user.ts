
export class DashboardUser {
    constructor(
        public fullName: string = "",
        public hasCompany: boolean = false,
        public showWelcomeTab: boolean = true,
        public roles: string[] = []
    ) {  }
}