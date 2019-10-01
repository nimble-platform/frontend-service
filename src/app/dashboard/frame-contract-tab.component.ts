import {Component, OnInit} from "@angular/core";
import {DigitalAgreement} from "../catalogue/model/publish/digital-agreement";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";
import {selectPartyName, selectPreferredValues} from "../common/utils";
import {CallStatus} from "../common/call-status";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {Router} from "@angular/router";
import {TranslateService} from '@ngx-translate/core';
/**
 * Created by suat on 28-Mar-18.
 */

@Component({
    selector: "frame-contract-tab",
    templateUrl: "./frame-contract-tab.component.html",
    styleUrls: ["./frame-contract-tab.component.css"]
})
export class FrameContractTabComponent implements OnInit {
    frameContracts: DigitalAgreement[] = [];
    frameContractsRetrievalCallStatus: CallStatus = new CallStatus();

    getProductName = selectPreferredValues;

    constructor(private bpeService: BPEService,
                private cookieService: CookieService,
                private translate: TranslateService,
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
            this.frameContractsRetrievalCallStatus.callback(null, true);

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

    getCorrespondingPartyId(frameContract: DigitalAgreement): string {
        let userPartyId = this.cookieService.get("company_id");

        for(let party of frameContract.participantParty) {
            if(party.partyIdentification[0].id != userPartyId) {
                return UBLModelUtils.getPartyId(party);
            }
        }
    }

    getCorrespondingPartyName(frameContract: DigitalAgreement ): string {
        let userPartyId = this.cookieService.get("company_id");

        for(let party of frameContract.participantParty) {
            if(party.partyIdentification[0].id != userPartyId) {
                return selectPartyName(party.partyName);
            }
        }
    }
}
