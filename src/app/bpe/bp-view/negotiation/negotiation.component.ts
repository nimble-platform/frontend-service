import {Component, OnInit, Input, OnDestroy} from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";
import {ThreadEventMetadata} from "../../../catalogue/model/publish/thread-event-metadata";
import {DocumentService} from "../document-service";
import {BpActivityEvent} from "../../../catalogue/model/publish/bp-start-event";
import {Subscription} from "rxjs/Subscription";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})
export class NegotiationComponent implements OnInit, OnDestroy {

    initCallStatus: CallStatus = new CallStatus();
    negotiationDocumentsCallStatus: CallStatus = new CallStatus();
    bpActivityEventSubs: Subscription;
    negotiationProcessList: any[] = [];
    negotiationDocuments: any[] = [];
    companyNegotiationSettings: CompanyNegotiationSettings;
    newProcess: boolean;
    sliderIndex: number = -1;


    constructor(private bpDataService: BPDataService,
                private documentService: DocumentService) {
    }

    ngOnInit() {
        // subscribe to the bp change event so that we can update negotiation history when a new negotiation process is initialized with a negotiation response
        // in this case, the view is not refreshed but we have add a new negotiation history element for the new process, otherwise we lose the last history item
        this.bpActivityEventSubs = this.bpDataService.bpActivityEventObservable.subscribe(bpActivityEvent => {
            if (bpActivityEvent) {
                if(bpActivityEvent.processType == 'Negotiation' &&
                    bpActivityEvent.newProcess &&
                    bpActivityEvent.processHistory.length > 0 &&
                    bpActivityEvent.processHistory[bpActivityEvent.processHistory.length-1].processType == 'Negotiation') {

                    this.negotiationProcessList.push(null);
                    this.sliderIndex++;
                }
            }
        });

        if(this.bpDataService.requestForQuotation == null) {
            this.initCallStatus.submit();
            this.bpDataService.initRfq(this.bpDataService.getCompanySettings().negotiationSettings)
                .then(() => {
                    this.initCallStatus.callback("Request for Quotation Initialized.");
                })
                .catch(error => {
                    this.initCallStatus.error("Error while initializing request for quotation.", error);
                });
        }

        this.newProcess = this.bpDataService.bpActivityEvent.newProcess;

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

    ngOnDestroy(): void {
        this.bpActivityEventSubs.unsubscribe();
    }


    private fetchHistoryDocuments(): void {
        // check there are entries in the history
        if(this.negotiationProcessList.length <= 1) {
            return;
        }

        this.negotiationDocumentsCallStatus.submit();
        let documentPromises: Promise<any>[] = [];
        // the documents for the last step is already available via the BpDataService
        for(let i=0; i < this.negotiationProcessList.length; i++) {
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
}