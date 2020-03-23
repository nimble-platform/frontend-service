import { PAGE_SIZE } from "../constants";

export class DashboardQuery {
    constructor(
        public archived: boolean = false,
        public collaborationRole: "BUYER" | "SELLER" = "BUYER",
        public page: number = 1,
        public products: string[] = [],
        public categories: string[] = [],
        public partners: string[] = [],
        public status: string[] = [],
        public instanceName:string = null,
        public pageSize: number = PAGE_SIZE
    ) {}
}
