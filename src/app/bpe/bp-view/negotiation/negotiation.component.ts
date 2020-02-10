import {Component, OnInit, OnDestroy, Input} from '@angular/core';
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
import {frameContractDurationUnitListId} from "../../../common/constants";
import {RequestForQuotation} from "../../../catalogue/model/publish/request-for-quotation";
import {Quantity} from "../../../catalogue/model/publish/quantity";
import {CatalogueLine} from '../../../catalogue/model/publish/catalogue-line';
import {FEDERATIONID} from '../../../catalogue/model/constants';

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})
export class NegotiationComponent implements OnInit, OnDestroy {

    initCallStatus: CallStatus = new CallStatus();
    negotiationDocumentsCallStatus: CallStatus = new CallStatus();
    lastOfferCalStatus: CallStatus = new CallStatus();
    frameContractAndTermsCallStatus: CallStatus = new CallStatus();

    primaryTermsSource: ('product_defaults' | 'frame_contract' | 'last_offer')[] = null;
    bpActivityEventSubs: Subscription;

    negotiationProcessList: any[] = [];
    negotiationDocuments: any[] = [];

    // rfq document to be passed into the inner negotiation request component
    rfq: RequestForQuotation;
    frameContracts:any;
    frameContractQuotations: Quotation[];
    isFrameContractBeingNegotiatedInThisNegotiation: boolean[];
    lastOfferQuotation: Quotation;
    defaultTermsAndConditions: any;

    newProcess: boolean;
    sliderIndex: number = -1;

    // whether the item is deleted or not
    @Input() areCatalogueLinesDeleted:boolean[];
    // the product for which the users negotiate
    @Input() selectedLineIndex:number;
    // whether the process details are viewed for all products in the negotiation
    @Input() areProcessDetailsViewedForAllProducts:boolean;

    constructor(public bpDataService: BPDataService,
                private bpeService: BPEService,
                private documentService: DocumentService,
                private cookieService: CookieService,
                private route: ActivatedRoute) {
    }

    ngOnInit() {
        this.primaryTermsSource = this.bpDataService.bpActivityEvent.termsSources;

        // subscribe to the bp change event so that we can update negotiation history when a new negotiation process is initialized with a negotiation response
        // in this case, the view is not refreshed but we have add a new negotiation history element for the new process
        this.bpActivityEventSubs = this.bpDataService.bpActivityEventObservable.subscribe(bpActivityEvent => {
            // we do this null check since the observable is initialized with a null event
            if (bpActivityEvent == null) {
                return;
            }

            if (bpActivityEvent.processType === 'Negotiation' &&
                bpActivityEvent.newProcess &&
                // this check is required in order to prevent double initialization of last offer and negotiation history
                // when a negotiation process is created for the first time
                this.isLastStepNegotiation(bpActivityEvent)) {

                // upon initiating a new negotiation step, the variables in the BpDataService are reset.
                // so we initialize the required rfq document again
                this.bpDataService.initRfqWithQuotation();
                this.rfq = this.bpDataService.requestForQuotation;
                this.initializeLastOffer();
                this.initializeNegotiationHistory();
            }
        });

        if(this.bpDataService.requestForQuotation == null) {
            this.initCallStatus.submit();
            this.bpDataService.initRfq()
                .then(() => {
                    this.performInitCalls();
                    this.initCallStatus.callback("Request for Quotation Initialized.", true);
                })
                .catch(error => {
                    this.initCallStatus.error("Error while initializing request for quotation.", error);
                });
        } else {
            this.performInitCalls();
        }
    }

    performInitCalls(): void {
        this.rfq = this.bpDataService.requestForQuotation;
        this.setFrameContractNegotiationFlag();
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
        let buyerFederationId;
        if(this.bpDataService.bpActivityEvent.userRole === 'buyer') {
            buyerPartyId = this.cookieService.get("company_id");
            buyerFederationId = FEDERATIONID();
        } else {
            // for sellers rfq should include buyer supplier party
            buyerPartyId = UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.buyerCustomerParty.party);
            buyerFederationId = this.bpDataService.requestForQuotation.buyerCustomerParty.party.federationInstanceID;
        }

        // retrieve default terms and conditions and frame contract
        this.frameContractAndTermsCallStatus.submit();

        let productIds = [];
        for(let rfqLine of this.bpDataService.requestForQuotation.requestForQuotationLine){
            productIds.push(rfqLine.lineItem.item.manufacturersItemIdentification.id);
        }

        let termsAndConditionsPromises = [];
        for(let catalogueLine of this.bpDataService.getCatalogueLines()){
            termsAndConditionsPromises.push(this.bpDataService.getCompanySettings().negotiationSettings.company.salesTerms && this.bpDataService.getCompanySettings().negotiationSettings.company.salesTerms.termOrCondition.length > 0
                ? this.bpDataService.getCompanySettings().negotiationSettings.company.salesTerms.termOrCondition // if the seller company has T&Cs, use them
                : this.bpeService.getTermsAndConditions( // otherwise, use the default T&Cs
                    buyerPartyId,
                    buyerFederationId,
                    UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLines()[0].goodsItem.item.manufacturerParty),
                    catalogueLine.goodsItem.deliveryTerms.incoterms,
                    this.bpDataService.getCompanySettings().negotiationSettings.paymentTerms[0],
                    this.bpDataService.getCatalogueLines()[0].goodsItem.item.manufacturerParty.federationInstanceID
                ));
        }

        let [termsAndConditions] = await Promise.all(
            termsAndConditionsPromises
        );

        this.defaultTermsAndConditions = termsAndConditions;

        let frameContracts:any = await this.bpeService.getFrameContract(
            UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLines()[0].goodsItem.item.manufacturerParty),
            buyerPartyId,
            productIds,
            buyerFederationId,
            this.bpDataService.getCatalogueLines()[0].goodsItem.item.manufacturerParty.federationInstanceID);

        this.frameContracts = [];
        for(let rfqLine of this.bpDataService.requestForQuotation.requestForQuotationLine){
            let frameContractForProduct = null;
            if(frameContracts){
                for(let frameContract of frameContracts){
                    if(rfqLine.lineItem.item.manufacturersItemIdentification.id == frameContract.item.manufacturersItemIdentification.id &&
                        rfqLine.lineItem.item.catalogueDocumentReference.id == frameContract.item.catalogueDocumentReference.id){
                        frameContractForProduct = frameContract;
                        break;
                    }
                }
            }
            this.frameContracts.push(frameContractForProduct);
        }
        let frameContractQuotationPromises= [];
        for(let frameContract of this.frameContracts){
            if(frameContract == null){
                frameContractQuotationPromises.push(Promise.resolve(null));
            }
            else{
                // load the quotation associated to the frame contract
                frameContractQuotationPromises.push(this.documentService.getDocumentJsonContent(frameContract.quotationReference.id,this.bpDataService.getCatalogueLines()[0].goodsItem.item.manufacturerParty.federationInstanceID));
            }
        }

        this.frameContractQuotations = [];
        let size = frameContractQuotationPromises.length;
        for(let i = 0; i < size;i++){
            let frameContract:DigitalAgreement = this.frameContracts[i];
            let frameContractQuotationPromise = frameContractQuotationPromises[i];
            let frameContractQuotation = await frameContractQuotationPromise;
            if(frameContractQuotation != null) {
                // retrieve the corresponding documents for the frame contract and last offer
                this.frameContractQuotations.push(frameContractQuotation);
                // this check is required to prevent override the value passed via the route subscription
                let primaryTermsSourceIndex = this.getPrimaryTermsSourceForProduct(frameContract.item.catalogueDocumentReference.id,frameContract.item.manufacturersItemIdentification.id);
                if(this.primaryTermsSource[primaryTermsSourceIndex] == null) {
                    this.primaryTermsSource[primaryTermsSourceIndex] = 'frame_contract';
                }
            }
        }

        this.frameContractAndTermsCallStatus.callback(null, true);
        return null;
    }

    private getPrimaryTermsSourceForProduct(catalogueId:string,lineId:string){
        let size = this.bpDataService.getCatalogueLines().length;
        for(let i=0; i <size;i++){
            const catalogueUuid = this.bpDataService.getCatalogueLines()[i].goodsItem.item.catalogueDocumentReference.id;
            const catalogueLineId = this.bpDataService.getCatalogueLines()[i].goodsItem.item.manufacturersItemIdentification.id;

            if(catalogueUuid == catalogueId && catalogueLineId == lineId){
                return i;
            }
        }
        return null;
    }

    private async initializeLastOffer(): Promise<any> {
        this.lastOfferCalStatus.submit();

        let responseDocument: Promise<any> = this.getLastOfferQuotationPromise();
        this.lastOfferQuotation = await responseDocument;
        if(this.lastOfferQuotation != null) {
            for(let primaryTermsSource of this.primaryTermsSource){
                primaryTermsSource = 'last_offer';
            }
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
            responseDocument = this.documentService.getResponseDocument(this.bpDataService.bpActivityEvent.processHistory[checkIndex].activityVariables,this.bpDataService.bpActivityEvent.processHistory[checkIndex].sellerFederationId);
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
            documentPromises.push(this.documentService.getInitialDocument(this.negotiationProcessList[i].activityVariables,this.negotiationProcessList[i].sellerFederationId));
            documentPromises.push(this.documentService.getResponseDocument(this.negotiationProcessList[i].activityVariables,this.negotiationProcessList[i].sellerFederationId));
        }

        Promise.all(documentPromises).then(responseArray => {
            for(let i=0; i<responseArray.length; i++) {
                let documents: any = {};
                documents.request = responseArray[i];
                i++;
                documents.response = responseArray[i];
                this.negotiationDocuments.push(documents);
            }

            // once the documents are retrieved, check whether the frame contract is being negotiated in this negotiation
            this.setFrameContractNegotiationFlag();

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


    getPrimaryTermsSource(lastOfferQuotation): ('product_defaults' | 'frame_contract' | 'last_offer')[] {
        let termsSources = this.primaryTermsSource;
        let size = termsSources.length;
        for(let i = 0; i < size;i++){
            if(termsSources[i] == null) {
                if(this.frameContracts[i] != null && !this.isFrameContractBeingNegotiatedInThisNegotiation[i]) {
                    termsSources[i] = 'frame_contract';
                } else {
                    termsSources[i] = 'product_defaults';
                }
            } else if(termsSources[i] == 'last_offer' || termsSources[i] == 'frame_contract') {
                if(lastOfferQuotation == null) {
                    if(this.frameContracts[i] != null && !this.isFrameContractBeingNegotiatedInThisNegotiation[i]) {
                        termsSources[i] = 'frame_contract';
                    } else {
                        termsSources[i] = 'product_defaults';
                    }
                }
            }
        }
        return termsSources;
    }

    // this method is called a few times as soon as various information is fetched
    setFrameContractNegotiationFlag(): void {
        // stores the products (catalogue id, line id pairs) for which the frame contracts are being negotiated
        let productsFrameContractsBeingNegotiatedFor:any = [];
        this.isFrameContractBeingNegotiatedInThisNegotiation = [];
        for(let primaryTermsSource of this.primaryTermsSource){
            this.isFrameContractBeingNegotiatedInThisNegotiation.push(false);
        }

        let requestForQuotation = null;
        // first check the current request for quotation contains a frame contract duration. currently it is assumed that if an rfq contains a frame
        // contract duration, the contract is being negotiated in that history
        let frameContractDuration: Quantity;
        if(this.bpDataService.requestForQuotation) {
            requestForQuotation = this.bpDataService.requestForQuotation;
            let size = requestForQuotation.requestForQuotationLine.length;
            for(let i = 0; i <size;i++){
                let catalogueId = requestForQuotation.requestForQuotationLine[i].lineItem.item.catalogueDocumentReference.id;
                let lineId = requestForQuotation.requestForQuotationLine[i].lineItem.item.manufacturersItemIdentification.id;
                frameContractDuration = UBLModelUtils.getFrameContractDurationFromRfqLine(requestForQuotation.requestForQuotationLine[i]);
                if(!UBLModelUtils.isEmptyQuantity(frameContractDuration)) {
                    // frame contract is being negotiated for the product
                    let productExists = false;
                    for (let productFrameContractsBeingNegotiatedFor of productsFrameContractsBeingNegotiatedFor) {
                        if(catalogueId == productFrameContractsBeingNegotiatedFor.catalogueId && lineId == productFrameContractsBeingNegotiatedFor.lineId ){
                            productExists = true;
                            break;
                        }
                    }
                    if(!productExists){
                        productsFrameContractsBeingNegotiatedFor.push({catalogueId:catalogueId,lineId:lineId});
                    }
                }
            }
        }

        // check the negotiation history documents
        for(let i=0; i<this.negotiationDocuments.length; i=i+2) {
            let rfq: RequestForQuotation = this.negotiationDocuments[i].request;
            if(requestForQuotation == null){
                requestForQuotation = rfq;
            }
            let size = rfq.requestForQuotationLine.length;
            for(let i = 0; i <size;i++){
                let catalogueId = rfq.requestForQuotationLine[i].lineItem.item.catalogueDocumentReference.id;
                let lineId = rfq.requestForQuotationLine[i].lineItem.item.manufacturersItemIdentification.id;
                frameContractDuration = UBLModelUtils.getFrameContractDurationFromRfqLine(rfq.requestForQuotationLine[i]);
                if (!UBLModelUtils.isEmptyQuantity(frameContractDuration)) {
                    // frame contract is being negotiated for the product
                    let productExists = false;
                    for (let productFrameContractsBeingNegotiatedFor of productsFrameContractsBeingNegotiatedFor) {
                        if(catalogueId == productFrameContractsBeingNegotiatedFor.catalogueId && lineId == productFrameContractsBeingNegotiatedFor.lineId ){
                            productExists = true;
                            break;
                        }
                    }
                    if(!productExists){
                        productsFrameContractsBeingNegotiatedFor.push({catalogueId:catalogueId,lineId:lineId});
                    }
                }
            }
        }
        // update this.isFrameContractBeingNegotiatedInThisNegotiation array according to the productsFrameContractsBeingNegotiatedFor array
        let size = requestForQuotation.requestForQuotationLine.length;
        for(let i = 0; i < size ;i++){
            let catalogueId = requestForQuotation.requestForQuotationLine[i].lineItem.item.catalogueDocumentReference.id;
            let lineId = requestForQuotation.requestForQuotationLine[i].lineItem.item.manufacturersItemIdentification.id;
            for (let productFrameContractsBeingNegotiatedFor of productsFrameContractsBeingNegotiatedFor) {
                if(catalogueId == productFrameContractsBeingNegotiatedFor.catalogueId && lineId == productFrameContractsBeingNegotiatedFor.lineId ){
                    this.isFrameContractBeingNegotiatedInThisNegotiation[i] = true;
                    break;
                }
            }
        }
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

    showNegotiationResponse(){
        let isCollaborationCancelled = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.collaborationStatus == 'CANCELLED';
        let isResponseSent = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.processStatus == 'Completed';
        return isResponseSent || (this.bpDataService.quotation && !isCollaborationCancelled);
    }
}
