import {Component, OnInit, OnDestroy} from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import {ThreadEventMetadata} from "../../../catalogue/model/publish/thread-event-metadata";
import {DocumentService} from "../document-service";
import {BpActivityEvent} from "../../../catalogue/model/publish/bp-start-event";
import {Subscription} from "rxjs/Subscription";
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {Quotation} from "../../../catalogue/model/publish/quotation";
import {ActivatedRoute} from "@angular/router";
import {BPEService} from "../../bpe.service";
import {CookieService} from "ng2-cookies";
import {Clause} from "../../../catalogue/model/publish/clause";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})
export class NegotiationComponent implements OnInit, OnDestroy {

    initCallStatus: CallStatus = new CallStatus();
    negotiationDocumentsCallStatus: CallStatus = new CallStatus();
    lastOfferCalStatus: CallStatus = new CallStatus();
    frameContractAndTermsCallStatus: CallStatus = new CallStatus();

    primaryTermsSource: 'product_defaults' | 'frame_contract' | 'last_offer' = null;
    bpActivityEventSubs: Subscription;

    negotiationProcessList: any[] = [];
    negotiationDocuments: any[] = [];

    frameContract:DigitalAgreement;
    frameContractQuotation: Quotation;
    lastOfferQuotation: Quotation;
    defaultTermsAndConditions: Clause[];

    newProcess: boolean;
    formerProcess: boolean = false; // true indicates that the last step of the history IS NOT negotiation
    sliderIndex: number = -1;

    constructor(private bpDataService: BPDataService,
                private bpeService: BPEService,
                private documentService: DocumentService,
                private cookieService: CookieService,
                private route: ActivatedRoute) {
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.primaryTermsSource = params["termsSource"];
        });


        // subscribe to the bp change event so that we can update negotiation history when a new negotiation process is initialized with a negotiation response
        // in this case, the view is not refreshed but we have add a new negotiation history element for the new process, otherwise we lose the last history item
        this.bpActivityEventSubs = this.bpDataService.bpActivityEventObservable.subscribe(bpActivityEvent => {
            if (bpActivityEvent) {
                if(bpActivityEvent.processType == 'Negotiation' &&
                    bpActivityEvent.newProcess &&
                    this.isLastStepNegotiation(bpActivityEvent)) {

                    this.formerProcess = false;
                    this.initializeLastOffer();
                    this.initializeNegotiationHistory();
                }
            }
        });

        if(this.bpDataService.requestForQuotation == null) {
            this.initCallStatus.submit();
            this.bpDataService.initRfq(this.bpDataService.getCompanySettings().negotiationSettings)
                .then(() => {
                    this.initCallStatus.callback("Request for Quotation Initialized.", true);
                })
                .catch(error => {
                    this.initCallStatus.error("Error while initializing request for quotation.", error);
                });
        }

        this.initializeLastOffer();
        this.initialDefaultTermsAndConditionsAndFrameContract();
        this.initializeNegotiationHistory();
    }

    ngOnDestroy(): void {
        this.bpActivityEventSubs.unsubscribe();
    }

    /**
     * Initializing methods
     */

    private async initialDefaultTermsAndConditionsAndFrameContract(): Promise<any> {
        let buyerPartyId;
        if(this.bpDataService.bpActivityEvent.userRole === 'buyer') {
            buyerPartyId = this.cookieService.get("company_id");
        } else {
            // for sellers rfq should include buyer supplier party
            buyerPartyId = UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.buyerCustomerParty.party);
        }

        // retrieve default terms and conditions and frame contract
        this.frameContractAndTermsCallStatus.submit();
        let [termsAndConditions, frameContract] = await Promise.all([
            this.bpeService.getTermsAndConditions(
                null,
                buyerPartyId,
                UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty),
                null,
                this.bpDataService.getCatalogueLine().goodsItem.deliveryTerms.incoterms,
                this.bpDataService.getCompanySettings().negotiationSettings.paymentTerms[0]
            ),

            // retrieve frame contract
            this.bpeService.getFrameContract(
                UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty),
                buyerPartyId,
                this.bpDataService.requestForQuotation.requestForQuotationLine[0].lineItem.item.manufacturersItemIdentification.id)
        ]);
        this.defaultTermsAndConditions = termsAndConditions;
        this.frameContract = frameContract;

        let frameContractQuotationPromise: Promise<any> = Promise.resolve(null);
        if(frameContract != null) {
            // load the quotation associated to the frame contract
            frameContractQuotationPromise = this.documentService.getDocumentJsonContent(this.frameContract.quotationReference.id);
        }

        // retrieve the corresponding documents for the frame contract and last offer
        this.frameContractQuotation = await frameContractQuotationPromise;
        if(this.frameContractQuotation != null) {
            // this check is required to prevent override the value passed via the route subscription
            if(this.primaryTermsSource == null) {
                this.primaryTermsSource = 'frame_contract';
            }
        }

        this.frameContractAndTermsCallStatus.callback(null, true);
        return null;
    }

    private async initializeLastOffer(): Promise<any> {
        this.lastOfferCalStatus.submit();

        let responseDocument: Promise<any> = this.getLastOfferQuotationPromise();
        this.lastOfferQuotation = await responseDocument;
        if(this.lastOfferQuotation != null) {
            this.primaryTermsSource = 'last_offer';
        }

        this.lastOfferCalStatus.callback(null, true);
        return null;
    }

    private getLastOfferQuotationPromise(): Promise<any> {
        let responseDocument: Promise<any> = Promise.resolve(null);

        if(this.isLastStepNegotiation(this.bpDataService.bpActivityEvent)) {
            let checkIndex = 0;
            // if the process is not new, then the previous step is in the 1st index i.e. [1]
            if(!this.bpDataService.bpActivityEvent.newProcess) {
                checkIndex = 1;
            }
            responseDocument = this.documentService.getResponseDocument(this.bpDataService.bpActivityEvent.processHistory[checkIndex].activityVariables);
        }

        return responseDocument;
    }

    private initializeNegotiationHistory(): void {
        this.newProcess = this.bpDataService.bpActivityEvent.newProcess;
        this.negotiationProcessList = [];

        let history: ThreadEventMetadata[] = this.bpDataService.bpActivityEvent.processHistory;
        if(history && history.length > 0) {
            for(let processMetadata of history) {
                if(processMetadata.processType == 'Negotiation') {
                    this.negotiationProcessList.push(processMetadata);
                }
            }

            // check the last step of the history to set the formerProcess parameter
            if(history[0].processType != 'Negotiation') {
                this.formerProcess = true;
            }

            // reverse the list so that the most recent item will be at the end
            this.negotiationProcessList = this.negotiationProcessList.reverse();
        }

        // if this is a new process, put an empty object
        // just to have a correct number of elements in the negotiationProcessList array
        if(this.newProcess) {
            this.negotiationProcessList.push(null);
        }

        this.sliderIndex = this.negotiationProcessList.length-1;
        this.fetchHistoryDocuments();
    }

    private fetchHistoryDocuments(): void {
        // check there are entries in the history
        if(this.negotiationProcessList.length <= 1) {
            return;
        }

        this.negotiationDocumentsCallStatus.submit();
        this.negotiationDocuments = [];
        let documentPromises: Promise<any>[] = [];
        // the documents for the last step is already available via the BpDataService
        for(let i=0; i < this.negotiationProcessList.length - 1; i++) {
            documentPromises.push(this.documentService.getInitialDocument(this.negotiationProcessList[i].activityVariables));
            documentPromises.push(this.documentService.getResponseDocument(this.negotiationProcessList[i].activityVariables));
        }

        Promise.all(documentPromises).then(responseArray => {
            for(let i=0; i<responseArray.length; i++) {
                let documents: any = {};
                documents.request = responseArray[i];
                i++;
                documents.response = responseArray[i];
                this.negotiationDocuments.push(documents);
            }

            this.negotiationDocumentsCallStatus.callback(null, true);
        }).catch(error => {
            this.negotiationDocumentsCallStatus.error("Failed to get previous negotiation documents", error);
        });
    }

    isLoading(): boolean {
        return this.initCallStatus.fb_submitted;
    }

    /**
     * Template getters
     */


    getPrimaryTermsSource(lastOfferQuotation): 'product_defaults' | 'frame_contract' | 'last_offer' {
        let termsSource = this.primaryTermsSource;
        if(termsSource == null) {
            if(this.frameContract != null) {
                termsSource = 'frame_contract';
            } else {
                termsSource = 'product_defaults';
            }
        } else if(termsSource == 'last_offer' || termsSource == 'frame_contract') {
            if(lastOfferQuotation == null) {
                if(this.frameContract != null) {
                    termsSource = 'frame_contract';
                } else {
                    termsSource = 'product_defaults';
                }
            }
        }

        return termsSource;
    }

    /**
     * Internal methods
     */

    private isLastStepNegotiation(bpActivityEvent: BpActivityEvent): boolean {
        let checkIndex = 0;
        // if the event is emitted for an existing process, the history contains entry for that process
        // in such a case, we should check the soonest step which is available in the 1st index
        if(!bpActivityEvent.newProcess) {
            checkIndex = 1;
        }

        if(bpActivityEvent.processHistory.length > checkIndex &&
            bpActivityEvent.processHistory[checkIndex].processType == 'Negotiation') {
            return true;
        }
        return false;
    }
}