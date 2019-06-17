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
import * as myGlobals from '../globals';
import {CollaborationGroup} from '../bpe/model/collaboration-group';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as d3 from 'd3';
import * as moment from "moment";

@Component({
    selector: "dashboard-threaded",
    templateUrl: "./dashboard-threaded.component.html",
    styleUrls: ["./dashboard-threaded.component.css"]
})
export class DashboardThreadedComponent implements OnInit{

    user: DashboardUser;

    filterSet: ProcessInstanceGroupFilter;
    modifiedFilterSet: ProcessInstanceGroupFilter = new ProcessInstanceGroupFilter();
    filterQueryStatus: CallStatus = new CallStatus();

    queryParameters: DashboardQueryParameters = new DashboardQueryParameters();

    query: DashboardOrdersQuery = new DashboardOrdersQuery();
    querypopup: DashboardOrdersQuery = new DashboardOrdersQuery();

    results: DashboardOrdersQueryResults = new DashboardOrdersQueryResults();
    queryStatus: CallStatus = new CallStatus();

    exportCallStatus: CallStatus = new CallStatus();

    TABS = TABS;

    selectedId = "";
    selectedNegotiations = [];
    selectedNegotiation:any;
    selectedNegotiationLists = [];
    selectedNegotiationIndex = -1;
    isDivVisible = false;
    buyerCounter = 0;
    sellerCounter = 0;
    isProject = false;
    expanded = false;
    finalArray = [];
    finalXAsxisArray = [];
    private data: any = [
        // {times: [{"color":"green", "label":"Weeee", "starting_time": 1355752800000, "ending_time": 1355759900000}, {"color":"blue", "label":"Weeee", "starting_time": 1355767900000, "ending_time": 1355774400000}]},
      ];
    private chart: any;


    // this contains status-name-defaultName information of collaboration groups
    // if status is true, that means we are changing collaboration group name
    // defaultName is used if the collaboration group does not have any name assigned.
    updatingCollaborationGroupName = [];

    public config = myGlobals.config;


    constructor(
        private cookieService: CookieService,
        private modalService: NgbModal,
        private bpeService: BPEService,
        private userService: UserService,
        private router: Router,
        private route: ActivatedRoute,
        public appComponent: AppComponent
    ) {}



    ngOnInit() {
        this.computeUserFromCookies();
        this.getTabCounters();
        this.route.queryParams.subscribe(params => this.updateStateFromQueryParameters(params));
    }

    async clickexpand(data){
        if(this.selectedId != ""){
            this.data = [];
            this.chart = null;
            var idDiv = ".cls"+this.selectedId + " > svg";
            d3.select(idDiv).remove();
        }
        this.expanded = !this.expanded;
        this.isDivVisible = !this.isDivVisible;
        this.selectedId = data.id;
        var t_arr = [];
        await data.associatedProcessInstanceGroups.forEach(element => {
            var lastActivityTime = (new Date(element.lastActivityTime)).getTime();
            var firstActivityTime = (new Date(element.firstActivityTime)).getTime();
            if((new Date(element.lastActivityTime).getTime()) -(new Date(element.firstActivityTime).getTime()) < 86400000){
                firstActivityTime = new Date(element.firstActivityTime).getTime()-(86400000*1);
                lastActivityTime = (new Date(element.lastActivityTime)).getTime();
            }
            var obj =  { times: [{"color":"red", "label":element.name, "starting_time": firstActivityTime, "ending_time": lastActivityTime}]}
            t_arr.push((new Date(element.firstActivityTime)).getTime()/1000);
            t_arr.push((new Date(element.lastActivityTime)).getTime()/1000);
            this.data.push(obj);
        });
        this.data = this.data.sort(function(a,b){return a.times[0].starting_time - b.times[0].starting_time});
        var endDateSorted =  this.data.sort(function(a,b){return a.times[0].ending_time - b.times[0].ending_time});
        var projectDuration = endDateSorted[endDateSorted.length-1].times[0].ending_time-this.data[0].times[0].starting_time;
        var newArray = [];
        var arrayForXaxis= [];
        var itemid= 0;
        var colorcode = ['#ff4b66','#f36170','#e7727a','#d98185','#ca8e8f','#b99a9a','#a5a5a5'];
        var colorindex = 0;
        this.data.forEach(element => {
            var projectDurationPercetage = ((element.times[0].ending_time - element.times[0].starting_time)*700)/projectDuration;
            projectDuration = 700/this.data.length;
            var timeStampDate = new Date(element.times[0].ending_time);
            var timeLabel = moment.monthsShort(timeStampDate.getMonth())+ "/"+timeStampDate.getDate();
            var itemoffset =  0;
            var width = 700/this.data.length;
            if(itemid != 0){
                itemoffset = (700/this.data.length)*itemid - ((this.data[itemid-1].times[0].ending_time < element.times[0].starting_time) ? 50 : 0);

                newArray.forEach(element1 => {
                    var timeStampDatemoment = new Date(element1.enddate);
                    if(moment.monthsShort(timeStampDate.getMonth())+ "/"+timeStampDate.getDate() == moment.monthsShort(timeStampDatemoment.getMonth())+ "/"+timeStampDatemoment.getDate()){
                        itemoffset = element1.offset+itemid*10;
                        element1.duration = element1.duration+ width - itemid*10;
                        projectDuration = element1.duration- itemid*10;
                    }
                });
            }
            itemid++;
            if(colorindex == 6){
                colorindex = 0;;
            }
            newArray.push({label:element.times[0].label.toUpperCase(),duration: projectDuration, endDate:timeLabel,offset: itemoffset,startdate : element.times[0].starting_time,enddate: element.times[0].ending_time,color: colorcode[colorindex]});
            colorindex++;
        });
        this.finalArray = newArray;
        newArray.forEach(item => {
            arrayForXaxis.push({endDate:item.endDate,offset: (item.offset+item.duration)});
        });
        var parr = [];
        arrayForXaxis.filter(function(item){
            var it = parr.findIndex(x => (x.endDate == item.endDate && x.offset == item.offset));
            if(it <= -1){
                parr.push(item);
            }
            return null;
          });
        this.finalXAsxisArray = parr;


    }

    clickantiExampand(data){
        this.expanded = !this.expanded;
        this.isDivVisible = !this.isDivVisible;
        if(this.selectedId == data.id){
            this.selectedId = "";
            this.data = [];
            this.chart = null;
            var idDiv = "cls"+data.id;
            var myNode = document.getElementsByClassName(idDiv);
            while(myNode[0].hasChildNodes())
            {
            myNode[0].removeChild(myNode[0].lastChild);
            }
        }
    }

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
            if (this.appComponent.checkRoles('purchases'))
              this.updateQueryParameters({ tab: TABS.PURCHASES });
            else if (this.appComponent.checkRoles('sales'))
              this.updateQueryParameters({ tab: TABS.SALES });
            else
              this.updateQueryParameters({ tab: TABS.CATALOGUE });
        }
    }

    onToggleArchived(): void {
        this.updateQueryParameters({ arch: !this.queryParameters.arch });
    }

    onPageChange(): void {
        this.updateQueryParameters({ pg: this.query.page });
    }

    onPopUpPageChange(): void {
        this.getOrdersQuery(this.querypopup);
        // this.updateQueryParameters({ pg: this.query.page });
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
        this.getTabCounters();
    }

    onExportClicked() {
        this.exportCallStatus.submit();
        let partyId: string = this.cookieService.get("company_id");
        this.bpeService.exportTransactions(partyId, null, null, null).then(result => {

                var link = document.createElement('a');
                link.id = 'downloadLink';
                link.href = window.URL.createObjectURL(result.content);
                link.download = result.fileName;

                document.body.appendChild(link);
                var downloadLink = document.getElementById('downloadLink');
                downloadLink.click();
                document.body.removeChild(downloadLink);

                this.exportCallStatus.callback("Exported transactions successfully", true);
            },
            error => {
                this.exportCallStatus.error("Failed to export transactions", error);
            });
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
            this.user.hasCompany = this.cookieService.get("company_id") !== "null"
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

    private getTabCounters() {
      this.buyerCounter = 0;
      this.sellerCounter = 0;
      this.bpeService
      .getActionRequiredCounter(this.cookieService.get("company_id"))
      .then(response => {
          this.buyerCounter = parseInt(response.buyer);
          this.sellerCounter = parseInt(response.seller);
      });
    }

    private updateStateFromQueryParameters(params: Params | DashboardQueryParameters): void {
        this.queryParameters = new DashboardQueryParameters(
            this.sanitizeTab(params["tab"]),                        // tab
            params["arch"] === "true" || params["arch"] === true,   // archived
            this.sanitizePage(params["pg"]),                        // page
            params["prd"],                                          // products
            params["cat"],                                          // categories
            params["prt"],                                          // partners
            params["sts"]                                           // status
        )

        switch(this.queryParameters.tab) {
            case TABS.PURCHASES:
            case TABS.FAVOURITE:
            case TABS.COMPARE:
            case TABS.PROJECTS:
            case TABS.PERFORMANCE:
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
            if(upped === TABS.CATALOGUE || upped === TABS.SALES || upped === TABS.WELCOME || upped === TABS.FAVOURITE || upped == TABS.COMPARE || upped == TABS.PROJECTS || upped == TABS.PERFORMANCE) {
                return upped;
            }
        }
        if (this.appComponent.checkRoles('purchases'))
          return TABS.PURCHASES;
        if (this.appComponent.checkRoles('sales'))
          return TABS.SALES;
        if (this.appComponent.checkRoles('catalogue'))
          return TABS.CATALOGUE;
        if (this.appComponent.checkRoles('favourite'))
          return TABS.FAVOURITE;
        if (this.appComponent.checkRoles('compare'))
          return TABS.COMPARE;
        if (this.config.projectsEnabled && this.appComponent.checkRoles('projects'))
          return TABS.PROJECTS;
        if (this.appComponent.checkRoles('performance'))
          return TABS.PERFORMANCE;
        return null;
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

    async queryOrdersIfNeeded() {
        const query = this.computeOrderQueryFromQueryParams();

        if(await this.isOrdersFiltersQueryNeeded(query)) {
            this.executeOrdersFiltersQuery(query);
        }

        if(this.isOrdersQueryNeeded(query)) {
            this.executeOrdersQuery(query);
        }

        this.query = query
    }

    private executeOrdersQuery(query: DashboardOrdersQuery): void {
        this.queryStatus.submit();
        this.getOrdersQuery(query)
        .then(() =>{
            this.queryStatus.callback("Successfully fetched orders", true);
        })
        .catch(error => {
            this.queryStatus.error("Error while fetching orders.", error);
        });
    }

    private getOrdersQuery(query: DashboardOrdersQuery): Promise<void> {


        if(this.queryParameters.tab == "PROJECTS"){
            this.isProject = true;
        }else{
            this.isProject = false;
        }

        if(query.archived) {
            // only one query needed
            return this.bpeService
            .getCollaborationGroups(this.cookieService.get("company_id"),
                query.collaborationRole, query.page - 1, query.pageSize, query.archived,
                query.products, query.categories, query.partners,query.status)
            .then(response => {
                this.results = new DashboardOrdersQueryResults(
                    response.collaborationGroups,
                    response.collaborationGroups.length > 0,
                    response.size
                )
                this.createUpdatingCollaborationGroupNameArray()
            });
        } else {
            // Needs to query for archived orders to know if the "Show Archived" button should be enabled
            return Promise.all([
                // regular query
                this.bpeService.getCollaborationGroups(this.cookieService.get("company_id"),
                    query.collaborationRole, query.page - 1, query.pageSize, query.archived,
                    query.products, query.categories, query.partners,query.status,this.isProject
                ),
                // query for archived orders
                this.bpeService.getCollaborationGroups(this.cookieService.get("company_id"),
                    query.collaborationRole, 0, 1, true, [], [], [],[]
                ),
            ]).then(([response, archived]) => {
                this.results = new DashboardOrdersQueryResults(
                    response.collaborationGroups,
                    archived.collaborationGroups.length > 0,
                    response.size
                )
                this.createUpdatingCollaborationGroupNameArray()
            });
        }
    }

    private createUpdatingCollaborationGroupNameArray(){
        this.updatingCollaborationGroupName = [];
        for(let order of this.results.orders){
            this.updatingCollaborationGroupName.push({status:false,name:order.name,defaultName:this.getDefaultCollaborationNames(order)})
        }
    }

    private getDefaultCollaborationNames(collaborationGroup:CollaborationGroup):string{
        let defaultName = "Activities on ";
        for(let i = 0 ; i < collaborationGroup.associatedProcessInstanceGroups.length ; i++){
            if(i == collaborationGroup.associatedProcessInstanceGroups.length-1){
                defaultName += collaborationGroup.associatedProcessInstanceGroups[i].name;
            }
            else {
                defaultName += collaborationGroup.associatedProcessInstanceGroups[i].name+", ";
            }
        }
        return defaultName;
    }

    areOrdersLoading(): boolean {
        return this.queryStatus.fb_submitted;
    }

    private executeOrdersFiltersQuery(query: DashboardOrdersQuery): void {
        this.filterQueryStatus.submit();
        if(this.queryParameters.tab == "PROJECTS"){
            this.isProject = true;
        }else{
            this.isProject = false;
        }

        this.bpeService
        .getProcessInstanceGroupFilters(this.cookieService.get("company_id"), query.collaborationRole, query.archived, query.products, query.categories, query.partners, query.status,this.isProject)
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
            this.filterQueryStatus.callback("Successfully fetched filters", true);
        })
        .catch(error => {
            this.filterQueryStatus.error("Failed to get filters", error);
        });
    }

    areFiltersLoading(): boolean {
        return this.filterQueryStatus.fb_submitted;
    }

    private isOrdersQueryNeeded(query: DashboardOrdersQuery): boolean {
        return true;
    }

    private isOrdersFiltersQueryNeeded(query: DashboardOrdersQuery): boolean {
        // filterSet may be set to null to request a recompute of the filter sets.
        if(!this.filterSet) {
            return true;
        }
        if(this.queryParameters.tab == "PROJECTS" && this.isProject == false){
            return true;

        }else if(this.queryParameters.tab != "PROJECTS" && this.isProject == true){
            return true;
        }
        // Do not recompute the filters on filter changes.
        return this.query.archived !== query.archived
            || this.query.collaborationRole !== query.collaborationRole;
    }

    private computeOrderQueryFromQueryParams(): DashboardOrdersQuery {
        return new DashboardOrdersQuery(
            this.queryParameters.arch,
            this.queryParameters.tab === TABS.PURCHASES || this.queryParameters.tab == TABS.PROJECTS ? "BUYER" : "SELLER",
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

    changeCollaborationGroupNameStatus(index:number,status:boolean){
        // if status is true,then we will change the name of the group.
        if(status){
            this.updatingCollaborationGroupName[index].name = this.results.orders[index].name;
        }
        this.updatingCollaborationGroupName[index].status = status;
    }

    updateCollaborationGroupName(id:string,name:string){
        this.bpeService.updateCollaborationGroupName(id,name)
            .then(() => {
                this.onOrderRemovedFromView();
            })
            .catch(err => {
                console.error("Failed to update collaboration group name",err);
            });
    }

    archiveGroup(id: string): void {
        this.bpeService.archiveCollaborationGroup(id)
            .then(() => {
               this.onOrderRemovedFromView();
            })
            .catch(err => {
                console.error("Failed to archive collaboration group",err);
            });
    }

    restoreGroup(id: string): void {
        this.bpeService.restoreCollaborationGroup(id)
            .then(() => {
                this.onOrderRemovedFromView();
            })
            .catch(err => {
                console.error("Failed to restore collaboration group",err);
            });
    }

    deleteGroup(id: string): void {
        if (confirm("Are you sure that you want to delete this collaboration group?")) {
            this.bpeService.deleteCollaborationGroup(id)
                .then(() => {
                    this.onOrderRemovedFromView();
                })
                .catch(err => {
                    console.error("Failed to delete the collaboration group",err);
                });
        }
    }

    open(content,index,order) {
        this.selectedNegotiation = order;
        this.selectedNegotiationIndex = index + (this.query.page -1)*this.query.pageSize;
        this.modalService.open(content, {backdropClass: 'light-blue-backdrop'}).result.then((result) => {
            this.selectedNegotiations = [];
        }, (reason) => {
            this.selectedNegotiations = [];
        });
    }

    changeNegotation(index,order){
        let lastindex = index + (this.querypopup.page -1)*this.querypopup.pageSize;
        if(this.selectedNegotiations.indexOf(lastindex) > -1){
            let indexOfNegotation = this.selectedNegotiations.indexOf(lastindex);
            this.selectedNegotiations.splice(indexOfNegotation,1);
            delete this.selectedNegotiationLists[lastindex];
        }else{
            this.selectedNegotiations.push(lastindex);
            this.selectedNegotiationLists[lastindex] = order;
        }
    }

    async mergeNegotations(){
        let selectedNegotation = this.selectedNegotiation.id;
        let mergeIdList = [];


        await this.selectedNegotiationLists.forEach(item => {
            mergeIdList.push(item.id);
        })

        this.bpeService.mergeNegotations(selectedNegotation,mergeIdList)
        .then(() => {
            location.reload();
        })
        .catch(err => {
        });
    }

}
