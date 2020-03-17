import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DashboardQueryParameters} from '../model/dashboard-query-parameters';
import {DashboardOrdersQueryResults} from '../model/dashboard-orders-query-results';
import {CallStatus} from '../../common/call-status';
import {ProcessInstanceGroupFilter} from '../../bpe/model/process-instance-group-filter';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {BPEService} from '../../bpe/bpe.service';
import {CookieService} from 'ng2-cookies';
import {DashboardOrdersQuery} from '../model/dashboard-orders-query';
import {FEDERATION, FEDERATIONID} from '../../catalogue/model/constants';
import {PAGE_SIZE, TABS} from '../constants';
import {FederatedCollaborationGroupMetadata} from '../../bpe/model/federated-collaboration-group-metadata';
import * as myGlobals from '../../globals';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CollaborationGroup} from '../../bpe/model/collaboration-group';
import {DashboardUser} from '../model/dashboard-user';
import {deepEquals} from '../../common/utils';
import {AppComponent} from '../../app.component';
@Component({
    selector: 'groups-tab',
    templateUrl: './groups-tab.component.html',
    styleUrls: ['./groups-tab.component.css']
})
export class GroupsTabComponent {
    _selectedTab: string;
    @Input()
    set selectedTab(value: string) {
        this._selectedTab = value;
        this.updateQueryParameters({ tab: value });
    }
    get selectedTab(): string {
        return this._selectedTab;
    }
    @Output() onViewUpdatedEvent: EventEmitter<void> = new EventEmitter();

    user: DashboardUser;
    queryParameters: DashboardQueryParameters = new DashboardQueryParameters();
    query: DashboardOrdersQuery = new DashboardOrdersQuery();
    querypopup: DashboardOrdersQuery = new DashboardOrdersQuery();
    filterSet: ProcessInstanceGroupFilter;
    modifiedFilterSet: ProcessInstanceGroupFilter = new ProcessInstanceGroupFilter();
    results: DashboardOrdersQueryResults = new DashboardOrdersQueryResults();
    isProject = false;
    delegated = (FEDERATION() === 'ON');
    // this contains status-name-defaultName information of collaboration groups
    // if status is true, that means we are changing collaboration group name
    // defaultName is used if the collaboration group does not have any name assigned.
    updatingCollaborationGroupName = [];

    selectedNegotiations = [];
    selectedNegotiation: any;
    selectedNegotiationLists = [];
    selectedNegotiationIndex = -1;

    selectedId: string;

    queryStatus: CallStatus = new CallStatus();
    filterQueryStatus: CallStatus = new CallStatus();
    exportCallStatus: CallStatus = new CallStatus();

    TABS = TABS;
    config = myGlobals.config;

    constructor(private bpeService: BPEService,
                private translate: TranslateService,
                private cookieService: CookieService,
                private modalService: NgbModal,
                private router: Router,
                private route: ActivatedRoute,
                private appComponent: AppComponent) {}

    /**
     * init methods
     */

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.updateStateFromQueryParameters(params)
        });
    }

    /**
     * event handlers
     */

    onViewUpdated(reset?: boolean): void {
        this.filterSet = null;
        this.updateStateFromQueryParameters(this.queryParameters, reset);
        this.onViewUpdatedEvent.emit();
    }

    onToggleArchived(): void {
        this.updateQueryParameters({ arch: !this.queryParameters.arch });
    }

    onFilterChange(): void {
        this.updateQueryParameters({
            prd: this.toString(this.modifiedFilterSet.relatedProducts),
            cat: this.toString(this.modifiedFilterSet.relatedProductCategories),
            sts: this.toString(this.modifiedFilterSet.status),
            prt: this.getSelectedPartners(this.modifiedFilterSet),
            ins: this.toString(this.modifiedFilterSet.instanceNames)
        })
    }

    onPageChange(): void {
        this.updateQueryParameters({ pg: this.query.page });
    }

    onExportClicked() {
        this.exportCallStatus.submit();
        let partyId: string = this.cookieService.get('company_id');
        this.bpeService.exportTransactions(partyId, null, null, null).then(result => {

                let link = document.createElement('a');
                link.id = 'downloadLink';
                link.href = window.URL.createObjectURL(result.content);
                link.download = result.fileName;

                document.body.appendChild(link);
                let downloadLink = document.getElementById('downloadLink');
                downloadLink.click();
                document.body.removeChild(downloadLink);

                this.exportCallStatus.callback('Exported transactions successfully', true);
            },
            error => {
                this.exportCallStatus.error('Failed to export transactions', error);
            });
    }

    updateCollaborationGroupName(id: string, federationId: string, name: string) {
        this.bpeService.updateCollaborationGroupName(id, federationId, name)
            .then(() => {
                this.onViewUpdated(false);
            })
            .catch(err => {
                console.error('Failed to update collaboration group name', err);
            });
    }

    changeCollaborationGroupNameStatus(index: number, status: boolean) {
        // if status is true,then we will change the name of the group.
        if (status) {
            this.updatingCollaborationGroupName[index].name = this.results.orders[index].name;
        }
        this.updatingCollaborationGroupName[index].status = status;
    }

    async mergeNegotations(c: any) {
        let selectedNegotation = this.selectedNegotiation.id;
        let collaborationGroupsMetadatas: FederatedCollaborationGroupMetadata[] = [];


        await this.selectedNegotiationLists.forEach(item => {
            collaborationGroupsMetadatas.push(new FederatedCollaborationGroupMetadata(item.id, item.federationId));
        });

        this.bpeService.mergeNegotations(selectedNegotation, collaborationGroupsMetadatas, this.selectedNegotiation.federationId)
            .then(() => {
                c();
                this.onViewUpdated(true);
            });
    }

    changeNegotation(index, order) {
        let lastindex = index + (this.querypopup.page - 1) * this.querypopup.pageSize;
        if (this.selectedNegotiations.indexOf(lastindex) > -1) {
            let indexOfNegotation = this.selectedNegotiations.indexOf(lastindex);
            this.selectedNegotiations.splice(indexOfNegotation, 1);
            delete this.selectedNegotiationLists[lastindex];
        } else {
            this.selectedNegotiations.push(lastindex);
            this.selectedNegotiationLists[lastindex] = order;
        }
    }

    open(content, index, order) {
        this.selectedNegotiation = order;
        this.selectedNegotiationIndex = index + (this.query.page - 1) * this.query.pageSize;
        this.modalService.open(content, {backdropClass: 'light-blue-backdrop'}).result.then((result) => {
            this.selectedNegotiations = [];
            this.selectedNegotiationLists = [];
        }, () => {
            this.selectedNegotiations = [];
            this.selectedNegotiationLists = [];
        });
    }

    archiveGroup(id: string, federationId: string): void {
        this.bpeService.archiveCollaborationGroup(id, federationId)
            .then(() => {
                this.onOrderRemovedFromView();
            })
            .catch(err => {
                console.error('Failed to archive collaboration group', err);
            });
    }

    restoreGroup(id: string, federationId: string): void {
        this.bpeService.restoreCollaborationGroup(id, federationId)
            .then(() => {
                this.onOrderRemovedFromView();
            })
            .catch(err => {
                console.error('Failed to restore collaboration group', err);
            });
    }

    deleteGroup(id: string, federationId: string): void {
        if (confirm('Are you sure that you want to delete this collaboration group?')) {
            this.bpeService.deleteCollaborationGroup(id, federationId)
                .then(() => {
                    this.onOrderRemovedFromView();
                })
                .catch(err => {
                    console.error('Failed to delete the collaboration group', err);
                });
        }
    }

    onOrderRemovedFromView(): void {
        this.filterSet = null;
        if (this.results.resultCount === 1 && this.query.page > 1) {
            this.updateQueryParameters({ pg: this.queryParameters.pg - 1 });
        } else {
            this.updateStateFromQueryParameters(this.queryParameters, true);
        }
        this.onViewUpdatedEvent.emit();
    }

    onExpandTimeline(collaborationGroup: CollaborationGroup): void {
        this.selectedId = collaborationGroup.id;
    }

    onCollapseTimeline(): void {
        this.selectedId = '';
    }

    /**
     * selectors for the template
     */

    areOrdersLoading(): boolean {
        return this.queryStatus.fb_submitted;
    }

    isToggleArchivedButtonEnabled(): boolean {
        return this.query.archived || this.results.hasArchivedOrders
    }

    getToggleArchivedButtonText(): string {
        if (!this.isToggleArchivedButtonEnabled()) {
            return this.translate.instant('No Archived Orders');
        }
        return this.query.archived ? this.translate.instant('Back') : this.translate.instant('Show Archived');
    }

    areFiltersLoading(): boolean {
        return this.filterQueryStatus.fb_submitted;
    }

    // isFacetFilterActive(): boolean {
    //     if (!this.queryParameters.prd || !this.queryParameters.cat || this.queryParameters.prt || this.queryParameters.sts) {
    //         return true;
    //     }
    //     return false;
    // }

    /**
     * internal logic
     */

    /**
     * Sets the parameters in the URL, this in turns triggers `this.updateStateFromQueryParameters(params)`.
     *
     * @param params the updated parameters
     */
    private updateQueryParameters(params: Partial<DashboardQueryParameters>): void {
        const queryParams = { ...this.queryParameters, ...params }
        this.router.navigate(['dashboard'], { queryParams: queryParams });
    }

    private updateStateFromQueryParameters(params: Params | DashboardQueryParameters, forceUpdate = false): void {
        let page: number = this.sanitizePage(params['pg']);
        if (forceUpdate) {
            page = 1;
        }
        this.queryParameters = new DashboardQueryParameters(
            this.sanitizeTab(params['tab']),                        // tab
            params['arch'] === 'true' || params['arch'] === true,   // archived
            page,                                                   // page
            params['prd'],                                          // products
            params['cat'],                                          // categories
            params['prt'],                                          // partners
            params['sts'],                                          // status
            params['ins']                                           // instance name
        );

        this.queryOrdersIfNeeded(forceUpdate);
    }

    private queryOrdersIfNeeded(forceUpdate = false) {
        const query = this.computeOrderQueryFromQueryParams();

        if (forceUpdate || this.isOrdersFiltersQueryNeeded(query)) {
            this.executeOrdersFiltersQuery(query);
        }

        if (forceUpdate || this.isOrdersQueryNeeded(query)) {
            this.executeOrdersQuery(query);
        }

        this.query = query
    }

    private computeOrderQueryFromQueryParams(): DashboardOrdersQuery {
        return new DashboardOrdersQuery(
            this.queryParameters.arch,
            this.queryParameters.tab === TABS.PURCHASES || this.queryParameters.tab === TABS.PROJECTS ? 'BUYER' : 'SELLER',
            this.queryParameters.pg,
            this.parseArray(this.queryParameters.prd),
            this.parseArray(this.queryParameters.cat),
            this.parseArray(this.queryParameters.prt),
            this.parseArray(this.queryParameters.sts),
            this.queryParameters.ins,
            PAGE_SIZE,
        )
    }

    private isOrdersFiltersQueryNeeded(query: DashboardOrdersQuery): boolean {
        // filterSet may be set to null to request a recompute of the filter sets.
        if (!this.filterSet) {
            return true;
        }
        if (this.queryParameters.tab === 'PROJECTS' && this.isProject === false) {
            return true;

        } else if (this.queryParameters.tab !== 'PROJECTS' && this.isProject === true) {
            return true;
        }
        // Do not recompute the filters on filter changes.
        return this.query.archived !== query.archived
            || this.query.collaborationRole !== query.collaborationRole || this.query.instanceName !== query.instanceName;
    }

    private executeOrdersFiltersQuery(query: DashboardOrdersQuery): void {
        this.filterQueryStatus.submit();
        if (this.queryParameters.tab === 'PROJECTS') {
            this.isProject = true;
        } else {
            this.isProject = false;
        }

        this.bpeService
            .getProcessInstanceGroupFilters(this.cookieService.get('company_id'), query.instanceName, query.collaborationRole,
                query.archived, query.products, query.categories, query.partners, query.status, this.isProject)
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
                if (query.status.length > 0 ) {
                    for (let status of response.status) {
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
                // instance names
                if (query.instanceName) {
                    this.modifiedFilterSet.instanceNames.push(query.instanceName);
                } else {
                    this.modifiedFilterSet.instanceNames.push(FEDERATIONID());
                }
                this.filterSet = response;
                this.filterQueryStatus.callback('Successfully fetched filters', true);
            })
            .catch(error => {
                this.filterQueryStatus.error('Failed to get filters', error);
            });
    }

    private isOrdersQueryNeeded(query: DashboardOrdersQuery): boolean {
        if (!deepEquals(this.query, query)) {
            return true;
        }
        return false;
    }

    private executeOrdersQuery(query: DashboardOrdersQuery): void {
        this.results = new DashboardOrdersQueryResults();
        this.queryStatus.submit();
        this.getOrdersQuery(query)
            .then(() => {
                this.queryStatus.callback('Successfully fetched orders', true);
            })
            .catch(error => {
                this.queryStatus.error('Error while fetching orders.', error);
            });
    }

    private getOrdersQuery(query: DashboardOrdersQuery): Promise<void> {


        if (this.queryParameters.tab === 'PROJECTS') {
            this.isProject = true;
        } else {
            this.isProject = false;
        }

        if (query.archived) {
            // only one query needed
            return this.bpeService
                .getCollaborationGroups(this.cookieService.get('company_id'),
                    query.instanceName, query.collaborationRole, query.page - 1, query.pageSize, query.archived,
                    query.products, query.categories, query.partners, query.status)
                .then(response => {
                    this.results = new DashboardOrdersQueryResults(
                        response.collaborationGroups,
                        response.collaborationGroups.length > 0,
                        response.size
                    );
                    this.createUpdatingCollaborationGroupNameArray()
                });
        } else {
            // Needs to query for archived orders to know if the "Show Archived" button should be enabled
            // TODO no need make the following calls synchronous
            return Promise.all([
                // regular query
                this.bpeService.getCollaborationGroups(this.cookieService.get('company_id'), query.instanceName,
                    query.collaborationRole, query.page - 1, query.pageSize, query.archived,
                    query.products, query.categories, query.partners, query.status, this.isProject
                ),
                // query for archived orders
                this.bpeService.getCollaborationGroups(this.cookieService.get('company_id'), query.instanceName,
                    query.collaborationRole, 0, 1, true, [], [], [], []
                ),
            ]).then(([response, archived]) => {
                this.results = new DashboardOrdersQueryResults(
                    response.collaborationGroups,
                    archived.collaborationGroups.length > 0,
                    response.size
                );
                this.createUpdatingCollaborationGroupNameArray()
            });
        }
    }

    private createUpdatingCollaborationGroupNameArray() {
        this.updatingCollaborationGroupName = [];
        for (let order of this.results.orders) {
            this.updatingCollaborationGroupName.push({status: false, name: order.name, defaultName: this.getDefaultCollaborationNames(order)})
        }
    }

    private getDefaultCollaborationNames(collaborationGroup: CollaborationGroup): string {
        let defaultName = this.translate.instant('Activities on') + ' ';
        for (let i = 0 ; i < collaborationGroup.associatedProcessInstanceGroups.length ; i++) {
            if (i === collaborationGroup.associatedProcessInstanceGroups.length - 1) {
                defaultName += collaborationGroup.associatedProcessInstanceGroups[i].name;
            } else {
                defaultName += collaborationGroup.associatedProcessInstanceGroups[i].name + ', ';
            }
        }
        return defaultName;
    }

    private getSelectedPartners(filter: ProcessInstanceGroupFilter): string {
        return filter.tradingPartnerNames.map(name => {
            // get the index in the original filter set
            const index = this.filterSet.tradingPartnerNames.indexOf(name)
            // get the ID corresponding to the index
            return this.filterSet.tradingPartnerIDs[index]
        }).join('_SEP_');
    }

    private sanitizeTab(tab: string): string {
        if (!tab) {
            if (this.queryParameters.tab) {
                return this.queryParameters.tab;
            }
        } else {
            const upped = tab.toUpperCase()
            if (upped === TABS.PURCHASES ||
                upped === TABS.SALES ||
                upped === TABS.PROJECTS) {
                return upped;
            }
        }
        if (this.appComponent.checkRoles('purchases')) {
            return TABS.PURCHASES;
        }
        if (this.appComponent.checkRoles('sales')) {
            return TABS.SALES;
        }
        if (this.config.projectsEnabled && this.appComponent.checkRoles('projects')) {
            return TABS.PROJECTS;
        }
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

    private parseArray(param: string): string[] {
        return param ? param.split('_SEP_') : [];
    }

    private toString(filters: string[]): string {
        return filters.join('_SEP_');
    }
}
