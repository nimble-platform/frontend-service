import { Component, OnInit } from "@angular/core";
import { AppComponent } from "../app.component";
import { CookieService } from "ng2-cookies";
import { BPEService } from "../bpe/bpe.service";
import { UserService } from '../user-mgmt/user.service';
import { ActivatedRoute, Router, Params } from "@angular/router";
import { TABS, PAGE_SIZE } from "./constants";
import { ProcessInstanceGroupFilter } from "../bpe/model/process-instance-group-filter";
import { CallStatus } from "../common/call-status";
import { DashboardOrdersQuery } from "./model/dashboard-orders-query";
import { DashboardOrdersQueryResults } from "./model/dashboard-orders-query-results";
import { DashboardQueryParameters } from "./model/dashboard-query-parameters";
import { DashboardUser } from "./model/dashboard-user";

@Component({
    selector: "dashboard-threaded",
    templateUrl: "./dashboard-threaded.component.html",
    styleUrls: ["./dashboard-threaded.component.css"]
})
export class DashboardThreadedComponent implements OnInit {

    user: DashboardUser;

    filterSet: ProcessInstanceGroupFilter;
    modifiedFilterSet: ProcessInstanceGroupFilter = new ProcessInstanceGroupFilter();
    filterQueryStatus: CallStatus = new CallStatus();
    filtersLoading: boolean = false;

    queryParameters: DashboardQueryParameters = new DashboardQueryParameters();

    query: DashboardOrdersQuery = new DashboardOrdersQuery();
    results: DashboardOrdersQueryResults = new DashboardOrdersQueryResults();

    TABS = TABS;

    constructor(
        private cookieService: CookieService,
        private bpeService: BPEService,
        private userService: UserService,
        private router: Router,
        private route: ActivatedRoute,
        public appComponent: AppComponent
    ) {}

    ngOnInit() {
        this.computeUserFromCookies()
        this.route.queryParams.subscribe(params => this.updateStateFromQueryParameters(params));
    }

    /*
     * Handlers called from the template.
     */

    onChangeTab(event: any): void {
        event.preventDefault();
        this.updateQueryParameters({ tab: event.target.id });
    }

    onCloseWelcomeTab(event: any): void {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.user.showWelcomeTab = false;
        this.userService.setWelcomeFlag(false)
        .then(res => {
          this.cookieService.set("show_welcome","false");
        });
        if(this.queryParameters.tab === TABS.WELCOME) {
            this.updateQueryParameters({ tab: TABS.PURCHASES })
        }
    }

    onToggleArchived(): void {
        this.updateQueryParameters({ arch: !this.queryParameters.arch });
    }

    onPageChange(): void {
        this.updateQueryParameters({ pg: this.query.page });
    }

    onFilterChange(): void {
        this.updateQueryParameters({
            prd: this.toString(this.modifiedFilterSet.relatedProducts),
            cat: this.toString(this.modifiedFilterSet.relatedProductCategories),
            sts: this.toString(this.modifiedFilterSet.status),
            prt: this.getSelectedPartners(this.modifiedFilterSet),
         })
    }

    onOrderRemovedFromView(): void {
        this.filterSet = null;
        if(this.results.resultCount === 1 && this.query.page > 1) {
            this.updateQueryParameters({ pg: this.queryParameters.pg - 1 });
        } else {
            this.updateStateFromQueryParameters(this.queryParameters);
        }
    }

    /*
     * Getters for the template
     */

    isToggleArchivedButtonEnabled(): boolean {
        return this.query.archived || this.results.hasArchivedOrders
    }

    getToggleArchivedButtonText(): string {
        if(!this.isToggleArchivedButtonEnabled()) {
            return "No Archived Orders"
        }
        return this.query.archived ? "Back" : "Show Archived"
    }

    /*
     * Internal methods.
     */

    private toString(filters: string[]): string {
        return filters.join("_SEP_")
    }

    private getSelectedPartners(filter: ProcessInstanceGroupFilter): string {
        return filter.tradingPartnerNames.map(name => {
            // get the index in the original filter set
            const index = this.filterSet.tradingPartnerNames.indexOf(name)
            // get the ID corresponding to the index
            return this.filterSet.tradingPartnerIDs[index]
        }).join("_SEP_")
    }

    /**
     * Sets the parameters in the URL, this in turns triggers `this.updateStateFromQueryParameters(params)`.
     *
     * @param params the updated parameters
     */
    private updateQueryParameters(params: Partial<DashboardQueryParameters>): void {
        const queryParams = { ...this.queryParameters, ...params }
        this.router.navigate(["dashboard"], { queryParams: queryParams });
    }

    private computeUserFromCookies(): void {
        this.user = new DashboardUser(
            this.cookieService.get("user_fullname") || ""
        )

        if (this.cookieService.get("user_id") && this.cookieService.get("company_id")) {
            this.user.hasCompany = this.cookieService.get("active_company_name") && this.cookieService.get("active_company_name") !== "null"
        } else {
            this.appComponent.checkLogin("/user-mgmt/login");
        }

        if (this.cookieService.get("bearer_token")) {
            const at = this.cookieService.get("bearer_token");
            if (at.split(".").length == 3) {
                const at_payload = at.split(".")[1];
                try {
                    const at_payload_json = JSON.parse(atob(at_payload));
                    const at_payload_json_roles = at_payload_json["realm_access"]["roles"];
                    this.user.roles = at_payload_json_roles;
                } catch (e) {}
            }
        }

        this.user.showWelcomeTab = this.cookieService.get("show_welcome") === "true";
    }

    private updateStateFromQueryParameters(params: Params | DashboardQueryParameters): void {
        this.queryParameters = new DashboardQueryParameters(
            this.sanitizeTab(params["tab"]),    // tab
            params["arch"] === "true",          // archived
            this.sanitizePage(params["pg"]),    // page
            params["prd"],                      // products
            params["cat"],                      // categories
            params["prt"],                      // partners
            params["sts"]                       // status
        )

        switch(this.queryParameters.tab) {
            case TABS.PURCHASES:
            case TABS.SALES:
                this.queryOrdersIfNeeded();
                return;
            default:
                // nothing
        }
    }

    private sanitizeTab(tab: string): string {
        if (!tab) {
            if (this.queryParameters.tab) {
                return this.queryParameters.tab;
            }
            if(this.user.showWelcomeTab) {
                return TABS.WELCOME;
            }
        } else {
            const upped = tab.toUpperCase()
            if(upped === TABS.CATALOGUE || upped === TABS.SALES || upped === TABS.WELCOME) {
                return upped;
            }
        }
        return TABS.PURCHASES;
    }

    private sanitizePage(page: string): number {
        if (page == null) {
            return (this.queryParameters.pg) || 1;
        }
        try {
            return Number.parseInt(page);
        } catch (e) {
            return 1;
        }

    }

    private queryOrdersIfNeeded(): void {
        const query = this.computeOrderQueryFromQueryParams();

        if(this.isOrdersQueryNeeded(query)) {
            this.executeOrdersQuery(query);
        }
        if(this.isOrdersFiltersQueryNeeded(query)) {
            this.executeOrdersFiltersQuery(query);
        }
        this.query = query
    }

    private executeOrdersQuery(query: DashboardOrdersQuery): void {
        if(query.archived) {
            // only one query needed
            this.bpeService
            .getProcessInstanceGroups(this.cookieService.get("company_id"),
                query.collaborationRole, query.page - 1, query.pageSize, query.archived,
                query.products, query.categories, query.partners,query.status)
            .then(response => {
                this.results = new DashboardOrdersQueryResults(
                    response.processInstanceGroups,
                    response.processInstanceGroups.length > 0,
                    response.size
                )
            });
        } else {
            // Needs to query for archived orders to know if the "Show Archived" button should be enabled
            Promise.all([
                // regular query
                this.bpeService.getProcessInstanceGroups(this.cookieService.get("company_id"),
                    query.collaborationRole, query.page - 1, query.pageSize, query.archived,
                    query.products, query.categories, query.partners,query.status
                ),
                // query for archived orders
                this.bpeService.getProcessInstanceGroups(this.cookieService.get("company_id"),
                    query.collaborationRole, 0, 1, true, [], [], [],[]
                ),
            ]).then(([response, archived]) => {
                this.results = new DashboardOrdersQueryResults(
                    response.processInstanceGroups,
                    archived.processInstanceGroups.length > 0,
                    response.size
                )
            });
        }
    }

    private executeOrdersFiltersQuery(query: DashboardOrdersQuery): void {
        this.filterQueryStatus.submit();
        this.filtersLoading = true;

        this.bpeService
        .getProcessInstanceGroupFilters(this.cookieService.get("company_id"), query.collaborationRole, query.archived, query.products, query.categories, query.partners, query.status)
        .then(response => {
            // populate the modified filter set with the passed parameters that are also included in the results
            // so that the selected criteria would have a checkbox along with
            this.modifiedFilterSet = new ProcessInstanceGroupFilter();
            // products
            if (query.products.length > 0) {
                for (let product of response.relatedProducts) {
                    this.modifiedFilterSet.relatedProducts.push(product);
                }
            }
            // status
            if (query.status.length > 0 ){
                for(let status of response.status){
                    this.modifiedFilterSet.status.push(status);
                }
            }
            // categories
            if (query.categories.length > 0) {
                for (let product of response.relatedProductCategories) {
                    this.modifiedFilterSet.relatedProductCategories.push(product);
                }
            }
            // partners
            if (query.partners.length > 0) {
                for (let i = 0; i < response.tradingPartnerIDs.length; i++) {
                    this.modifiedFilterSet.tradingPartnerIDs.push(response.tradingPartnerIDs[i]);
                    this.modifiedFilterSet.tradingPartnerNames.push(response.tradingPartnerNames[i]);
                }
            }
            this.filterSet = response;
            this.filterQueryStatus.callback("", true);
            this.filtersLoading = false;
        })
        .catch(error => {
            this.filtersLoading = false;
            this.filterQueryStatus.error("Failed to get filters");
        });
    }

    private isOrdersQueryNeeded(query: DashboardOrdersQuery): boolean {
        return true;
    }

    private isOrdersFiltersQueryNeeded(query: DashboardOrdersQuery): boolean {
        // filterSet may be set to null to request a recompute of the filter sets.
        if(!this.filterSet) {
            return true;
        }

        // Do not recompute the filters on filter changes.
        return this.query.archived !== query.archived
            || this.query.collaborationRole !== query.collaborationRole;
    }

    private computeOrderQueryFromQueryParams(): DashboardOrdersQuery {
        return new DashboardOrdersQuery(
            this.queryParameters.arch,
            this.queryParameters.tab === TABS.PURCHASES ? "BUYER" : "SELLER",
            this.queryParameters.pg,
            this.parseArray(this.queryParameters.prd),
            this.parseArray(this.queryParameters.cat),
            this.parseArray(this.queryParameters.prt),
            this.parseArray(this.queryParameters.sts),
            PAGE_SIZE,
        )
    }

    private parseArray(param: string): string[] {
        return param ? param.split("_SEP_") : []
    }
}
