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
/**
 * Created by suat on 28-Mar-18.
 */

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
            if(correspondingUserIds.length > 0){
                this.userService.getParties(correspondingUserIds).then(parties => {
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
                    id: this.getCorrespondingPartyId(frameContract)
                }
            });
    }

    navigateToQuotationDetails(frameContract: DigitalAgreement): void {
        this.router.navigate(['/bpe/frame-contract/' + frameContract.hjid]);
    }

    deleteFrameContract(frameContract: DigitalAgreement): void {
        if (confirm("Are you sure that you want to delete this frame contract?")){
            this.frameContractsRetrievalCallStatus.submit();
            this.bpeService.deleteFrameContract(frameContract.hjid).then(response => {
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

    getCorrespondingPartyName(frameContract: DigitalAgreement ): string {
        let userPartyId = this.cookieService.get("company_id");

        for(let party of frameContract.participantParty) {
            if(party.partyIdentification[0].id != userPartyId) {
                return this.partyNames.get((party.partyIdentification[0].id));
            }
        }
    }
}
