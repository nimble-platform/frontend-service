/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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
import {Component, ElementRef, Injectable, ViewChild} from '@angular/core'
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap'
import {BPEService} from '../../bpe/bpe.service';
import {CallStatus} from '../../common/call-status';
import {PlatformCompanyProductCount} from '../../bpe/model/platform-company-product-count';
import {Party} from '../../catalogue/model/publish/party';
import {selectPartyName} from '../../common/utils';
import {UserService} from '../../user-mgmt/user.service';
import {CompanyProcessCount} from '../../bpe/model/company-process-count';
import {config} from '../../globals';
import {Router} from '@angular/router';

@Component({
    selector: 'process-count-modal',
    templateUrl: './business-process-count-modal.component.html',
    styleUrls: ['./business-process-count-modal.component.css']
})
@Injectable()
export class BusinessProcessCountModalComponent {

    retrieveProcessCountStatisticsCallStatus: CallStatus = new CallStatus();

    platformCompanyProductCount: PlatformCompanyProductCount = null;

    @ViewChild('modal') modal: ElementRef;
    public partyMap: Map<string, string>
    public startDate = null;
    public endDate = null;
    // pagination related variables
    public pageSize = 10
    public start = 1
    public end = 0
    // page numbers start from 1
    public page = 1
    public offset = 0
    // current page in the pagination.
    private ngbModalRef: NgbModalRef;
    private isDateFilterApplied = false;

    constructor(private modalService: NgbModal,
                private bpeService: BPEService,
                private userService: UserService,
                private router: Router) {
    }

    /**
     * Opens the modal
     * */
    open() {
        this.onChangePage();

        this.ngbModalRef = this.modalService.open(this.modal, {windowClass: 'high-z-index'});
    }

    /**
     * Handles the pagination
     * */
    onChangePage(pageNumber: number = 1) {
        // reset the modal data
        this.platformCompanyProductCount = null;
        // set the offset based on the selected page
        this.offset = (pageNumber - 1) * this.pageSize;
        // set the page
        this.page = pageNumber;
        // set start of results
        this.start = (pageNumber - 1) * this.pageSize + 1;

        // retrieve the process counts for companies
        this.retrieveProcessCountStatisticsCallStatus.submit();
        this.bpeService.getProcessStatisticsForPlatform(this.offset, this.pageSize, this.formatDate(this.startDate), this.formatDate(this.endDate)).then(platformCompanyProductCount => {
            // check whether the date filter is applied
            this.isDateFilterApplied = !!(this.startDate || this.endDate);
            this.platformCompanyProductCount = platformCompanyProductCount;
            // set end of results
            this.end = pageNumber * this.pageSize > platformCompanyProductCount.totalCompanyCount ? platformCompanyProductCount.totalCompanyCount : pageNumber * this.pageSize;

            let partyIds = this.platformCompanyProductCount.companyProcessCounts.map(companyProcessCount => companyProcessCount.partyId)
            let federationIds = this.platformCompanyProductCount.companyProcessCounts.map(companyProcessCount => companyProcessCount.federationId)
            // get parties
            this.userService.getParties(partyIds, federationIds).then(parties => {
                // create party id-party map
                this.partyMap = this.createPartyMap(parties);
                // for each rfq, start a Negotiation or Order
                this.retrieveProcessCountStatisticsCallStatus.callback(null, true);
            }).catch(error => {
                this.retrieveProcessCountStatisticsCallStatus.error('Failed to retrieve statistics')
            })

        }).catch(error => {
            this.retrieveProcessCountStatisticsCallStatus.error('Failed to retrieve statistics')
        })
    }

    /**
     * Resets the date filter
     * */
    onResetFilter() {
        this.startDate = null;
        this.endDate = null;
        if (this.isDateFilterApplied) {
            this.onChangePage()
        }
    }

    onFilterByDate() {
        this.onChangePage(1)
    }

    /**
     * Formats the given date
     * @param date in the format YYYY-MM-DD
     * @return DD-MM-YYYY
     * */
    formatDate(date: string): string {
        if (date && date != '') {
            let dateParts = date.split('-');
            return dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];
        }
        return null;
    }

    /**
     * Navigates user to the company details page for the given one
     * */
    navigateToCompanyPage(companyProcessCount: CompanyProcessCount) {
        let isFromLocalInstance = config.federationInstanceId === companyProcessCount.federationId;
        let link = '';
        if (!isFromLocalInstance) {
            link += '/user-mgmt/company-details?id=' + companyProcessCount.partyId + '&delegateId=' + companyProcessCount.federationId;
        } else {
            link += '/user-mgmt/company-details?id=' + companyProcessCount.partyId;
        }
        this.ngbModalRef.close();
        this.router.navigateByUrl(link)
    }

    /**
     * Creates party id -party map for the given parties.
     * */
    private createPartyMap(parties: Party[]): Map<string, string> {
        let partyMap: Map<string, string> = new Map<string, string>();
        for (let party of parties) {
            partyMap.set(party.partyIdentification[0].id, selectPartyName(party.partyName));
        }
        return partyMap;
    }
}
