import { TABS } from "../constants";

/**
 * The query parameters exactly as they appear in the dashboard's URL.
 */
export class DashboardQueryParameters {
    constructor(
        public tab: string = null,
        public arch: boolean = false,
        public pg: number = 1,
        public prd: string = "",
        public cat: string = "",
        public prt: string = "",
        public sts: string = ""
    ) {  }
}