import {Component, Input, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {DocumentService} from "../document-service";
import {CallStatus} from "../../../common/call-status";
import {CatalogueService} from "../../../catalogue/catalogue.service";
import {FrameContractTransitionService} from "./frame-contract-transition.service";
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";
import {BPEService} from "../../bpe.service";
import {QuotationWrapper} from "../negotiation/quotation-wrapper";
import {selectPartyName, selectPreferredValues} from '../../../common/utils';
import {CookieService} from "ng2-cookies";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {TranslateService} from '@ngx-translate/core';
import {QuotationLine} from '../../../catalogue/model/publish/quotation-line';

/**
 * Created by suat on 02-Jul-19.
 */

@Component({
    selector: "frame-contract-details",
    templateUrl: "./frame-contract-details.component.html"
})
export class FrameContractDetailsComponent implements OnInit {
    getProductName = selectPreferredValues;

    @Input() frameContractQuotationId: string;
    quotationWrapper: QuotationWrapper;
    frameContract: DigitalAgreement;

    shownTab: string = 'MAIN_TERMS';
    frameContractRetrievalCallStatus: CallStatus = new CallStatus();
    showNoFrameContractLabel: boolean = false;

    constructor(private catalogueService: CatalogueService,
                private bpeService: BPEService,
                private frameContractTransitionService: FrameContractTransitionService,
                private documentService: DocumentService,
                private cookieService: CookieService,
                private route: ActivatedRoute,
                private translate: TranslateService,
                private router: Router) {
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            // grab the quotation id and frame contract first
            let frameContract: DigitalAgreement = this.frameContractTransitionService.frameContract;
            let quotationId = null;
            if (frameContract != null) {
                quotationId = frameContract.quotationReference.id;
            }

            if (quotationId == null) {
                if(params.id) {
                    this.frameContractRetrievalCallStatus.submit();
                    let frameContractPromise: Promise<DigitalAgreement>;
                    if (frameContract != null) {
                        frameContractPromise = Promise.resolve(frameContract);
                    } else {
                        frameContractPromise = this.bpeService.getFrameContractByHjid(params.id);
                    }

                    frameContractPromise.then(contractRes => {
                        this.frameContract = contractRes;
                        quotationId = contractRes.quotationReference.id;
                        let catalogueId: string = contractRes.item.catalogueDocumentReference.id;
                        let lineId: string = contractRes.item.manufacturersItemIdentification.id;

                        let catalogueLinePromise: Promise<any> = this.catalogueService.getCatalogueLine(catalogueId, lineId).catch(error => {
                            if(error.status == 404){
                                this.frameContractRetrievalCallStatus.error("The product with id "+lineId+" is deleted");
                            }
                        });
                        let quotationPromise: Promise<any> = this.documentService.getDocumentJsonContent(quotationId);

                        Promise.all([
                            catalogueLinePromise,
                            quotationPromise

                        ]).then(([catalogueLine, quotation]) => {
                            if(catalogueLine){
                                this.quotationWrapper = new QuotationWrapper(quotation, catalogueLine, this.getQuotationLineIndex(quotation.quotationLine,catalogueId,lineId));
                                this.frameContractRetrievalCallStatus.callback(null, true);
                            }
                        }).catch(error => {
                            this.frameContractRetrievalCallStatus.error("Failed to retrieve corresponding quotation and catalogue line", error);
                        });

                    }).catch(error => {
                        this.frameContractRetrievalCallStatus.error("Failed to retrieve frame contract details", error);
                    });

                }  else {
                    this.showNoFrameContractLabel = true;
                }
            }
        });
    }

    // we need to traverse quotation lines in the reverse order since we assume that if the same product exists in the negotiation multiple times,
    // frame contract is created for the last one
    getQuotationLineIndex(quotationLines:QuotationLine[],catalogueId:string,lineId:string):number{
        let size = quotationLines.length;
        for(let i = size-1; i > -1 ;i--){
            let quotationLine = quotationLines[i];
            if(quotationLine.lineItem.item.manufacturersItemIdentification.id == lineId && quotationLine.lineItem.item.catalogueDocumentReference.id == catalogueId){
               return i;
            }
        }
        return 0;
    }

    navigateToProductDetails(): void {
        this.router.navigate(['/product-details'],
            {
                queryParams: {
                    catalogueId: this.frameContract.item.catalogueDocumentReference.id,
                    id: this.frameContract.item.manufacturersItemIdentification.id
                }
            });
    }

    navigateToCompanyDetails(): void {
        this.router.navigate(['/user-mgmt/company-details'],
            {
                queryParams: {
                    id: this.getCorrespondingPartyId()
                }
            });
    }

    getCorrespondingPartyId(): string {
        let userPartyId = this.cookieService.get("company_id");

        for(let party of this.frameContract.participantParty) {
            if(party.partyIdentification[0].id != userPartyId) {
                return UBLModelUtils.getPartyId(party);
            }
        }
    }

    getCorrespondingPartyName(): string {
        let userPartyId = this.cookieService.get("company_id");

        for(let party of this.frameContract.participantParty) {
            if(party.partyIdentification[0].id != userPartyId) {
                return selectPartyName(party.partyName);
            }
        }
    }
}
