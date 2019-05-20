import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";
import {ThreadEventMetadata} from "../../../catalogue/model/publish/thread-event-metadata";
import {DocumentService} from "../document-service";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})
export class NegotiationComponent implements OnInit {

    initCallStatus: CallStatus = new CallStatus();
    negotiationDocumentsCallStatus: CallStatus = new CallStatus();
    negotiationProcessList: any[] = [];
    negotiationDocuments: any[] = [];
    companyNegotiationSettings: CompanyNegotiationSettings;
    newProcess: boolean;
    sliderIndex: number = -1;


    constructor(private bpDataService: BPDataService,
                private documentService: DocumentService) {
    }

    ngOnInit() {
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
        if(history) {
            for(let processMetadata of history) {
                if(processMetadata.processType == 'Negotiation') {
                    this.negotiationProcessList.push(processMetadata);
                }
            }
            // reverse the list so that the most recent item will be at the end
            this.negotiationProcessList = this.negotiationProcessList.reverse();

            // if this is a new process, put an empty object
            // just to have a correct number of elements in the negotiationProcessList array
            if(this.newProcess) {
                this.negotiationProcessList.push({});
            }

            this.sliderIndex = this.negotiationProcessList.length-1;
            this.fetchHistoryDocuments();
        }
    }

    private fetchHistoryDocuments(): void {
        // check there are entries in the history
        if(this.negotiationProcessList.length <= 1) {
            return;
        }

        this.negotiationDocumentsCallStatus.submit();
        let documentPromises: Promise<any>[] = [];
        // the documents for the last step is already available via the BpDataService
        for(let i=0; i < this.negotiationProcessList.length-1; i++) {
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