/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import {Component, OnInit} from "@angular/core";
import {DigitalAgreement} from "../catalogue/model/publish/digital-agreement";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";
import {selectPartyName, selectPreferredValues} from "../common/utils";
import {CallStatus} from "../common/call-status";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {Router} from "@angular/router";
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../user-mgmt/user.service';

@Component({
    selector: 'frame-contract-tab',
    templateUrl: './frame-contract-tab.component.html',
    styleUrls: ["./frame-contract-tab.component.css"]
})
export class FrameContractTabComponent implements OnInit {
    frameContracts: DigitalAgreement[] = [];
    frameContractsRetrievalCallStatus: CallStatus = new CallStatus();

    partyNames:Map<string, string> = new Map<string, string>();
    getProductName = selectPreferredValues;

    constructor(private bpeService: BPEService,
                private cookieService: CookieService,
                private translate: TranslateService,
                private userService: UserService,
                private router: Router) {
                }

    ngOnInit() {
        this.retrieveFrameContracts();
    }

    private retrieveFrameContracts(): void {
        let partyId = this.cookieService.get("company_id");
        this.frameContractsRetrievalCallStatus.submit();
        this.bpeService.getAllFrameContractsForParty(partyId).then(frameContracts => {
            this.frameContracts = frameContracts;
            let correspondingUserIds = this.getCorrespondingPartyIds(frameContracts);
            let correspondingFederationIds = this.getCorrespondingPartyFederationIds(frameContracts);
            if(correspondingUserIds.length > 0){
                this.userService.getParties(correspondingUserIds,correspondingFederationIds).then(parties => {
                    for(let party of parties){
                        this.partyNames.set(party.partyIdentification[0].id,selectPartyName(party.partyName));
                    }
                    this.frameContractsRetrievalCallStatus.callback(null, true);
                }).catch(error => {
                    this.frameContractsRetrievalCallStatus.error("Failed to retrieve corresponding party details");
                })
            }
            else{
                this.frameContractsRetrievalCallStatus.callback(null, true);
            }
        }).catch(error => {
            this.frameContractsRetrievalCallStatus.error("Failed to retrieve frame contracts");
        });
    }

    navigateToProductDetails(frameContract: DigitalAgreement): void {
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: frameContract.item.catalogueDocumentReference.id,
                    id: frameContract.item.manufacturersItemIdentification.id
                }
            });
    }

    navigateToCompanyDetails(frameContract: DigitalAgreement): void {
        this.router.navigate(['/user-mgmt/company-details'],
            {
                queryParams: {
                    id: this.getCorrespondingPartyId(frameContract),
                    delegateId: this.getCorrespondingPartyFederationId(frameContract)
                }
            });
    }

    navigateToQuotationDetails(frameContract: DigitalAgreement): void {
        this.router.navigate(['/bpe/frame-contract/' + frameContract.hjid + "/" + frameContract.item.manufacturerParty.federationInstanceID]);
    }

    deleteFrameContract(frameContract: DigitalAgreement): void {
        if (confirm("Are you sure that you want to delete this frame contract?")){
            this.frameContractsRetrievalCallStatus.submit();
            this.bpeService.deleteFrameContract(frameContract.hjid,frameContract.item.manufacturerParty.federationInstanceID).then(response => {
                // remove the deleted frame contract from the list
                let index = this.frameContracts.findIndex(fc => fc.hjid == frameContract.hjid);
                this.frameContracts.splice(index,1);

                this.frameContractsRetrievalCallStatus.callback(null, true);
            }).catch(error => {
                this.frameContractsRetrievalCallStatus.error("Failed to delete frame contract");
            })
        }
    }

    getCorrespondingPartyId(frameContract: DigitalAgreement): string {
        let userPartyId = this.cookieService.get("company_id");

        for(let party of frameContract.participantParty) {
            if(party.partyIdentification[0].id != userPartyId) {
                return UBLModelUtils.getPartyId(party);
            }
        }
    }

    getCorrespondingPartyFederationId(frameContract: DigitalAgreement): string {
        let userPartyId = this.cookieService.get("company_id");

        for(let party of frameContract.participantParty) {
            if(party.partyIdentification[0].id != userPartyId) {
                return party.federationInstanceID;
            }
        }
    }

    getCorrespondingPartyIds(frameContracts: DigitalAgreement[] ): string[] {
        let correspondingPartyIds = new Set();
        let userPartyId = this.cookieService.get("company_id");

        for(let frameContract of frameContracts){
            for(let party of frameContract.participantParty) {
                if(party.partyIdentification[0].id != userPartyId) {
                    correspondingPartyIds.add(party.partyIdentification[0].id);
                }
            }
        }

        return Array.from(correspondingPartyIds);
    }

    getCorrespondingPartyFederationIds(frameContracts: DigitalAgreement[] ): string[] {
        let correspondingPartyFederationIds = new Set();
        let userPartyId = this.cookieService.get("company_id");

        for(let frameContract of frameContracts){
            for(let party of frameContract.participantParty) {
                if(party.partyIdentification[0].id != userPartyId) {
                    correspondingPartyFederationIds.add(party.federationInstanceID);
                }
            }
        }

        return Array.from(correspondingPartyFederationIds);
    }

    getCorrespondingPartyName(frameContract: DigitalAgreement ): string {
        let userPartyId = this.cookieService.get("company_id");

        for(let party of frameContract.participantParty) {
            if(party.partyIdentification[0].id != userPartyId) {
                return this.partyNames.get((party.partyIdentification[0].id));
            }
        }
    }
}
