import { Component, OnInit } from "@angular/core";
import { AppComponent } from "../app.component";
import { CookieService } from "ng2-cookies";
import { BPEService } from "../bpe/bpe.service";
import { ActivatedRoute, Router, Params } from "@angular/router";
import { ProcessInstanceGroup } from "../bpe/model/process-instance-group";
import { TAB_SALES, TAB_PURCHASES, TAB_CATALOGUE, TAB_WELCOME } from "./constants";
import { ProcessInstanceGroupFilter } from "../bpe/model/process-instance-group-filter";
import { CallStatus } from "../common/call-status";
import { CollaborationRole } from "../bpe/model/collaboration-role";

@Component({
    selector: "dashboard-threaded",
    templateUrl: "./dashboard-threaded.component.html",
    styleUrls: ["./dashboard-threaded.component.css"]
})
export class DashboardThreadedComponent implements OnInit {
    fullName = "";
    hasCompany = false;
    roles = [];
    showWelcomeTab = true;

    ///////////////////// url parameters //////////////////////////
    qp_archived: boolean = false;
    qp_tab: string;
    qp_page: number = 1;
    qp_prd: string;
    qp_cat: string;
    qp_prt: string;
    ///////////////////// end of url parameters //////////////////////////

    limit: number = 5;
    pageSize: number = 5;
    size: number;

    groups: ProcessInstanceGroup[] = [];
    filterSet: ProcessInstanceGroupFilter = new ProcessInstanceGroupFilter();
    modifiedFilterSet: ProcessInstanceGroupFilter = new ProcessInstanceGroupFilter();

    TAB_SALES: string = TAB_SALES;
    TAB_PURCHASES: string = TAB_PURCHASES;
    TAB_CATALOGUE: string = TAB_CATALOGUE;
    TAB_WELCOME: string = TAB_WELCOME;

    filterQueryStatus: CallStatus = new CallStatus();
    filtersLoading: boolean = false;

    constructor(
        private cookieService: CookieService,
        private bpeService: BPEService,
        private router: Router,
        private route: ActivatedRoute,
        private appComponent: AppComponent
    ) {}

    ngOnInit() {
        // TODO compute if the welcome tab should be closed
        this.computeDataFromCookies();

        // handle query parameters
        this.route.queryParams.subscribe(params => this.computeQueryParameters(params));
    }

    private computeQueryParameters(params: Params): void {
            // handle simple parameters
            this.qp_archived = params["arch"] == "true" ? true : false;
            this.qp_tab = this.sanitizeTab(params["tab"]);
            this.qp_page = this.parsePage(params["pg"])

            switch(this.qp_tab) {
            case TAB_PURCHASES:
            case TAB_SALES:
                const passedProductsArray = this.parseArray(params["prd"]);
                const passedCategoriesArray = this.parseArray(params["cat"]);
                const passedPartnersArray = this.parseArray(params["prt"]);
                this.retrieveProcessInstanceGroups(passedProductsArray, passedCategoriesArray, passedPartnersArray);
                return;
            case TAB_CATALOGUE:
                // TODO fetch
                return
            default:
                // nothing
            }
    }

    private parseArray(param: string): string[] {
        return param ? param.split(",") : []
    }

    private parsePage(page: string): number {
        if (page == null) {
            return this.qp_page || 0
        }
        try {
            return Number.parseInt(page);
        } catch (e) {
            return 0;
        }
        
    }

    private sanitizeTab(tab: string): string {
        if (!tab) {
            if (this.qp_tab) {
                return this.qp_tab
            }
            if(this.showWelcomeTab) {
                return TAB_WELCOME
            }
        } else {
            const upped = tab.toUpperCase()
            if(upped === TAB_CATALOGUE || upped === TAB_SALES || upped === TAB_WELCOME) {
                return upped
            }
        }
        return TAB_PURCHASES
    }

    private computeDataFromCookies(): void {
        if (this.cookieService.get("user_fullname")) {
            this.fullName = this.cookieService.get("user_fullname");
        }

        if (this.cookieService.get("user_id") && this.cookieService.get("company_id")) {
            this.hasCompany = this.cookieService.get("active_company_name") && this.cookieService.get("active_company_name") !== "null"
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
                    this.roles = at_payload_json_roles;
                } catch (e) {}
            }
        }
    }

    retrieveProcessInstanceGroups(products: string[], categories: string[], parties: string[]): void {
        this.bpeService
            .getProcessInstanceGroups(this.cookieService.get("company_id"), this.getCollaborationRole(), this.qp_page - 1, this.limit, this.qp_archived, products, categories, parties)
            .then(response => {
                this.groups = response.processInstanceGroups;
                this.size = response.size;
            });

        this.filterQueryStatus.submit();
        this.filtersLoading = true;
        // TODO this should only be called if the filters actually change...
        this.bpeService
            .getProcessInstanceGroupFilters(this.cookieService.get("company_id"), this.getCollaborationRole(), this.qp_archived, products, categories, parties)
            .then(response => {
                // populate the modified filter set with the passed parameters that are also included in the results
                // so that the selected criteria would have a checkbox along with
                this.modifiedFilterSet = new ProcessInstanceGroupFilter();
                // products
                if (products.length > 0) {
                    for (let product of response.relatedProducts) {
                        this.modifiedFilterSet.relatedProducts.push(product);
                    }
                }
                // categories
                if (categories.length > 0) {
                    for (let product of response.relatedProductCategories) {
                        this.modifiedFilterSet.relatedProductCategories.push(product);
                    }
                }
                // partners
                if (parties.length > 0) {
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

    private getCollaborationRole(): CollaborationRole {
        return this.qp_tab === TAB_PURCHASES ? "BUYER" : "SELLER";
    }

    onToggleArchivedClick() {
        event.preventDefault();
        this.qp_archived = !this.qp_archived
        this.filterChangeHandler();
    }

    onTabClick(event: any) {
        event.preventDefault();
        this.qp_tab = event.target.id;
        this.filterChangeHandler();
    }

    paginationHandler(removed: boolean = false): void {
        let page = this.qp_page;
        // if one thread is removed then check whether there are other threads in this page or not
        if (removed && this.groups.length - 1 == 0 && this.qp_page != 1) {
            page = page - 1;
        }

        let queryParams: any = {
            pg: page,
            tab: this.qp_tab,
            arch: this.qp_archived,
            prd: this.qp_prd,
            cat: this.qp_cat,
            prt: this.qp_prt,
            t: Date.now()
        };
        this.filterSet = null;
        this.router.navigate(["dashboard"], { queryParams: queryParams });
    }

    filterChangeHandler(): void {
        let queryParams = this.populateQueryParamValue();
        this.filterSet = null;
        this.router.navigate(["dashboard"], { queryParams: queryParams });
    }

    populateQueryParamValue(): any {
        let queryParams: any = {
            pg: this.qp_page,
            tab: this.qp_tab,
            arch: this.qp_archived,
            t: Date.now()
        };

        let paramVal: string = "";
        // products
        if (this.modifiedFilterSet.relatedProducts.length > 0) {
            for (let selectedValue of this.modifiedFilterSet.relatedProducts) {
                paramVal += selectedValue + ",";
            }
            paramVal = paramVal.substring(0, paramVal.length - 1);
            this.qp_prd = queryParams.prd = paramVal;
        }

        // categories
        paramVal = "";
        if (this.modifiedFilterSet.relatedProductCategories.length > 0) {
            for (let selectedValue of this.modifiedFilterSet.relatedProductCategories) {
                paramVal += selectedValue + ",";
            }
            paramVal = paramVal.substring(0, paramVal.length - 1);
            this.qp_cat = queryParams.cat = paramVal;
        }

        // partners
        paramVal = "";
        if (this.modifiedFilterSet.tradingPartnerNames.length > 0) {
            for (let selectedValue of this.modifiedFilterSet.tradingPartnerNames) {
                // find the ID the selected partner by
                // first finding its name in the original name list and then the corresponding id original id list
                let originalIndex: number = this.filterSet.tradingPartnerNames.indexOf(selectedValue);
                paramVal += this.filterSet.tradingPartnerIDs[originalIndex] + ",";
            }
            paramVal = paramVal.substring(0, paramVal.length - 1);
            this.qp_prt = queryParams.prt = paramVal;
        }

        return queryParams;
    }
}
