/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DashboardQueryParameters } from '../model/dashboard-query-parameters';
import { CollaborationGroupResults } from '../model/collaboration-group-results';
import { CallStatus } from '../../common/call-status';
import { ProcessInstanceGroupFilter } from '../../bpe/model/process-instance-group-filter';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BPEService } from '../../bpe/bpe.service';
import { CookieService } from 'ng2-cookies';
import { DashboardQuery } from '../model/dashboard-query';
import { FEDERATION, FEDERATIONID } from '../../catalogue/model/constants';
import { PAGE_SIZE, TABS } from '../constants';
import { FederatedCollaborationGroupMetadata } from '../../bpe/model/federated-collaboration-group-metadata';
import * as myGlobals from '../../globals';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CollaborationGroup } from '../../bpe/model/collaboration-group';
import { DashboardUser } from '../model/dashboard-user';
import { deepEquals, selectNameFromLabelObject } from '../../common/utils';
import { AppComponent } from '../../app.component';
import { ProcessInstanceGroupResults } from '../model/process-instance-group-results';
import { CategoryService } from '../../catalogue/category/category.service';
@Component({
    selector: 'collaboration-groups-tab',
    templateUrl: './collaboration-groups-tab.component.html',
    styleUrls: ['./collaboration-groups-tab.component.css']
})
export class CollaborationGroupsTabComponent {
    _instance: string;
    @Input()
    set instance(value: string) {
        this._instance = value;
    }
    get instance(): string {
        return this._instance;
    }

    _selectedTab: string;
    @Input()
    set selectedTab(value: string) {
        this._selectedTab = value;
        if (this._instance)
            this.updateQueryParameters({ tab: value, ins: this._instance });
        else
            this.updateQueryParameters({ tab: value });
    }
    get selectedTab(): string {
        return this._selectedTab;
    }
    @Output() onViewUpdatedEvent: EventEmitter<void> = new EventEmitter();

    user: DashboardUser;
    queryParameters: DashboardQueryParameters = new DashboardQueryParameters();
    query: DashboardQuery = new DashboardQuery();
    // used for binding to the pagination entities. dedicated variables are needed to be able to identify the change in the
    // selected page and old page
    cgQueryPage = 1;
    pigQueryPage = 1;
    querypopup: DashboardQuery = new DashboardQuery();
    filterSet: ProcessInstanceGroupFilter;
    modifiedFilterSet: ProcessInstanceGroupFilter = new ProcessInstanceGroupFilter();
    collaborationGroupResults: CollaborationGroupResults;
    processInstanceGroupResults: ProcessInstanceGroupResults;
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

    categoryNames: string[] = null;
    processStatus: string[] = null;
    facetQueryParameterNames: string[] = ['', '', '', ''];
    TABS = TABS;
    config = myGlobals.config;

    constructor(private bpeService: BPEService,
        private translate: TranslateService,
        private cookieService: CookieService,
        private modalService: NgbModal,
        private router: Router,
        private route: ActivatedRoute,
        private categoryService: CategoryService,
        private appComponent: AppComponent) { }

    /**
     * init methods
     */

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['ins'])
                this._instance = params['ins'];
            this.updateStateFromQueryParameters(params)
        });
    }

    /**
     * event handlers
     */

    onViewUpdated(reset?: boolean): void {
        this.updateStateFromQueryParameters(this.queryParameters, reset);
        this.onViewUpdatedEvent.emit();
    }

    onToggleArchived(): void {
        this.updateQueryParameters({ arch: !this.queryParameters.arch });
    }

    onFilterChange(): void {
        // check which page number to use for the pagination
        // if there is no selected facet now, we should use the collaboration group page,
        // otherwise the one keeping the process instance page
        let page: number = this.isAnyFacetSelected(this.modifiedFilterSet) ? this.pigQueryPage : this.cgQueryPage;
        this.updateQueryParameters({
            prd: this.toString(this.modifiedFilterSet.relatedProducts),
            cat: this.toString(this.modifiedFilterSet.relatedProductCategories),
            sts: this.toString(this.modifiedFilterSet.status),
            prt: this.getSelectedPartners(this.modifiedFilterSet),
            ins: this.toString(this.modifiedFilterSet.instanceNames),
            pg: page
        });
    }

    onPageChange(): void {
        this.updateQueryParameters({ pg: this.isFacetFilterActive() ? this.pigQueryPage : this.cgQueryPage });
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

    updateCollaborationGroupName(cgIndex: number, id: string, federationId: string, name: string) {
        this.bpeService.updateCollaborationGroupName(id, federationId, name)
            .then(() => {
                (this.collaborationGroupResults as CollaborationGroupResults).collaborationGroups[cgIndex].name = name;
                this.changeCollaborationGroupNameStatus(cgIndex, false);
                this.onViewUpdated(false);
            })
            .catch(err => {
                console.error('Failed to update collaboration group name', err);
            });
    }

    changeCollaborationGroupNameStatus(index: number, status: boolean) {
        // if status is true,then we will change the name of the group.
        if (status) {
            this.updatingCollaborationGroupName[index].name = (this.collaborationGroupResults as CollaborationGroupResults).collaborationGroups[index].name;
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
        this.modalService.open(content, { backdropClass: 'light-blue-backdrop' }).result.then((result) => {
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
        this.appComponent.confirmModalComponent.open('Are you sure that you want to delete this collaboration group?').then(result => {
            if(result){
                this.bpeService.deleteCollaborationGroup(id, federationId)
                    .then(() => {
                        this.onOrderRemovedFromView();
                    })
                    .catch(err => {
                        console.error('Failed to delete the collaboration group', err);
                    });
            }
        });
    }

    onOrderRemovedFromView(): void {
        this.filterSet = null;
        if (this.collaborationGroupResults.resultCount === 1 && this.query.page > 1) {
            this.updateQueryParameters({ pg: this.queryParameters.pg - 1 });
        } else {
            this.onViewUpdated(true);
        }
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

    noDataConditionsMet(): boolean {
        return ((!this.isFacetFilterActive() && this.collaborationGroupResults && this.collaborationGroupResults.resultCount === 0) ||
            (this.isFacetFilterActive() && this.processInstanceGroupResults && this.processInstanceGroupResults.resultCount === 0)) &&
            !this.areOrdersLoading()
    }

    resultsAvailable(): boolean {
        return (!this.isFacetFilterActive() && this.collaborationGroupResults && this.collaborationGroupResults.resultCount > 0) ||
            (this.isFacetFilterActive() && this.processInstanceGroupResults && this.processInstanceGroupResults.resultCount > 0);
    }

    areOrdersLoading(): boolean {
        return this.queryStatus.fb_submitted;
    }

    isToggleArchivedButtonEnabled(): boolean {
        return this.query.archived || this.collaborationGroupResults.hasArchivedGroups
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

    isFacetFilterActive(): boolean {
        return this.includesSelectedFacet(this.queryParameters);
    }

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

        if (forceUpdate || this.isReexecutionNeeded(query)) {
            this.executeOrdersFiltersQuery(query);

            if (!this.isFacetFilterActive()) {
                this.executeCollaborationGroupQuery(query);
            } else {
                this.executeProcessInstanceGroupQuery(query);
            }
        }

        this.query = query
    }

    private computeOrderQueryFromQueryParams(): DashboardQuery {
        return new DashboardQuery(
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

    private isReexecutionNeeded(query: DashboardQuery): boolean {
        if (this.queryParameters.tab === 'PROJECTS' && this.isProject === false) {
            return true;

        } else if (this.queryParameters.tab !== 'PROJECTS' && this.isProject === true) {
            return true;
        }

        return !deepEquals(this.query, query);
    }

    private executeOrdersFiltersQuery(query: DashboardQuery): void {
        this.filterQueryStatus.submit();
        this.categoryNames = null;
        this.processStatus = null;
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
                if (query.status.length > 0) {
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
                // get category names
                this.getCategoryNames();
                this.filterQueryStatus.callback('Successfully fetched filters', true);
            })
            .catch(error => {
                this.filterQueryStatus.error('Failed to get filters', error);
            });
    }

    getCategoryNames() {
        if(this.filterSet.relatedProductCategories && this.filterSet.relatedProductCategories.length > 0){
            this.categoryService.getCategories(this.filterSet.relatedProductCategories).then(response => {
                this.categoryNames = [];
                for (let categoryUri of this.filterSet.relatedProductCategories) {
                    for (let category of response.result) {
                        if (categoryUri == category.uri) {
                            this.categoryNames.push(selectNameFromLabelObject(category.label));
                            break;
                        }
                    }
                }
            });
        }
        if(this.filterSet.status && this.filterSet.status.length > 0){
            this.processStatus = [];
            for (let status of this.filterSet.status) {
                this.processStatus.push(this.translate.instant(status));
            }
        }
    }

    private executeCollaborationGroupQuery(query: DashboardQuery): void {
        this.collaborationGroupResults = new CollaborationGroupResults();
        // for each query, we create a new CallStatus so that only the latest one is bound to the template.
        // otherwise, for the multiple queries, we might end up with a CallStatus loading forever since the callback count
        // may be higher than the call count which is 1.
        this.queryStatus = new CallStatus();
        // use the latest CallStatus for the query
        let queryStatus = this.queryStatus
        queryStatus.submit();
        this.getCollaborationGroupsQuery(query)
            .then(() => {
                queryStatus.callback('Successfully fetched collaboration groups', true);
            })
            .catch(error => {
                this.queryStatus.error('Error while fetching collaboration groups.', error);
            });
    }

    private executeProcessInstanceGroupQuery(query: DashboardQuery): void {
        this.collaborationGroupResults = new CollaborationGroupResults();
        // for each query, we create a new CallStatus so that only the latest one is bound to the template.
        // otherwise, for the multiple queries, we might end up with a CallStatus loading forever since the callback count
        // may be higher than the call count which is 1.
        this.queryStatus = new CallStatus();
        // use the latest CallStatus for the query
        let queryStatus = this.queryStatus
        queryStatus.submit();
        this.getProcessInstanceGroupsQuery(query)
            .then(() => {
                queryStatus.callback('Successfully fetched process instance groups', true);
            })
            .catch(error => {
                this.queryStatus.error('Error while fetching process instance groups.', error);
            });
    }

    private getCollaborationGroupsQuery(query: DashboardQuery): Promise<void> {
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
                    this.collaborationGroupResults = new CollaborationGroupResults(
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
                this.collaborationGroupResults = new CollaborationGroupResults(
                    response.collaborationGroups,
                    archived.collaborationGroups.length > 0,
                    response.size
                );
                this.createUpdatingCollaborationGroupNameArray()
            });
        }
    }

    private getProcessInstanceGroupsQuery(query: DashboardQuery): Promise<void> {
        if (query.archived) {
            // only one query needed
            return this.bpeService
                .getProcessInstanceGroups(this.cookieService.get('company_id'),
                    query.instanceName, query.collaborationRole, query.page - 1, query.pageSize, query.archived,
                    query.products, query.categories, query.partners, query.status)
                .then(response => {
                    this.processInstanceGroupResults = new ProcessInstanceGroupResults(
                        response.groups,
                        response.collaborationGroupIds,
                        response.groups.length > 0,
                        response.size
                    );
                    this.createUpdatingCollaborationGroupNameArray()
                });
        } else {
            // Needs to query for archived orders to know if the "Show Archived" button should be enabled
            // TODO no need make the following calls synchronous
            return Promise.all([
                // regular query
                this.bpeService.getProcessInstanceGroups(this.cookieService.get('company_id'), query.instanceName,
                    query.collaborationRole, query.page - 1, query.pageSize, query.archived,
                    query.products, query.categories, query.partners, query.status
                ),
                // query for archived orders
                this.bpeService.getProcessInstanceGroups(this.cookieService.get('company_id'), query.instanceName,
                    query.collaborationRole, 0, 1, true, [], [], [], []
                ),
            ]).then(([response, archived]) => {
                this.processInstanceGroupResults = new ProcessInstanceGroupResults(
                    response.groups,
                    response.collaborationGroupIds,
                    archived.groups.length > 0,
                    response.size
                );
            });
        }
    }

    private createUpdatingCollaborationGroupNameArray() {
        this.updatingCollaborationGroupName = [];
        for (let order of (this.collaborationGroupResults as CollaborationGroupResults).collaborationGroups) {
            this.updatingCollaborationGroupName.push({ status: false, name: order.name, defaultName: this.getDefaultCollaborationNames(order) })
        }
    }

    private getDefaultCollaborationNames(collaborationGroup: CollaborationGroup): string {
        let defaultName = this.translate.instant('Activities on') + ' ';
        for (let i = 0; i < collaborationGroup.associatedProcessInstanceGroups.length; i++) {
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

    includesSelectedFacet(queryParameters: DashboardQueryParameters): boolean {
        if (queryParameters.prd || queryParameters.cat || queryParameters.prt || queryParameters.sts) {
            return true;
        }
        return false;
    }

    isAnyFacetSelected(facetFilter: ProcessInstanceGroupFilter): boolean {
        if (facetFilter.relatedProductCategories.length > 0 || facetFilter.relatedProducts.length > 0 ||
            facetFilter.tradingPartnerIDs.length > 0 || facetFilter.status.length > 0) {
            return true;
        }
        return false;
    }

    private parseArray(param: string): string[] {
        return param ? param.split('_SEP_') : [];
    }

    private toString(filters: string[]): string {
        return filters.join('_SEP_');
    }
}
