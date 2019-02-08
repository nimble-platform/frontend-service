import {Component, Input, OnInit} from "@angular/core";
import {BPEService} from "../../bpe.service";
import {UserService} from "../../../user-mgmt/user.service";
import {CookieService} from "ng2-cookies";
import {BPDataService} from "../bp-data-service";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {ModelUtils} from "../../model/model-utils";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {Ppap} from "../../../catalogue/model/publish/ppap";
import {CallStatus} from "../../../common/call-status";
import {ActivatedRoute, Router} from "@angular/router";
import { Location } from "@angular/common";
import { copy } from "../../../common/utils";
import { Certificate } from "../../../user-mgmt/model/certificate";
import {DocumentService} from '../document-service';
import {DocumentReference} from '../../../catalogue/model/publish/document-reference';
import {BpStartEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';

type PpapLevels = [boolean, boolean, boolean, boolean, boolean]

interface PpapDocument {
    name: string
    levels: PpapLevels
}

@Component({
    selector: "ppap-document-select",
    templateUrl: "./ppap-document-select.component.html",
    styleUrls: ["./ppap-document-select.component.css"]
})
export class PpapDocumentSelectComponent implements OnInit {

    callStatus: CallStatus = new CallStatus();
    ppap: Ppap;

    /** The ppap level ,goes from 0 (level 1) to 4 (level 5). */
    level: number = 0;

    /** All available Ppap documents and if they should be checked for each level. */
    DOCUMENTS: PpapDocument[] = [
        { name: "Design Documentation",                         levels: [false,  true,  true,  true,  true] },
        { name: "Engineering Change Documentation",             levels: [false,  true,  true,  true,  true] },
        { name: "Customer Engineering Approval",                levels: [false, false,  true, false,  true] },
        { name: "Design Failure Mode and Effects Analysis",     levels: [false, false,  true, false,  true] },
        { name: "Process Flow Diagram",                         levels: [false, false,  true, false,  true] },
        { name: "Process Failure Mode and Effects Analysis",    levels: [false, false,  true, false,  true] },
        { name: "Control Plan",                                 levels: [false, false,  true, false,  true] },
        { name: "Measurement System Analysis Studies",          levels: [false, false,  true, false,  true] },
        { name: "Dimensional Results",                          levels: [false,  true,  true,  true,  true] },
        { name: "Records of Material / Performance Tests",      levels: [false,  true,  true,  true,  true] },
        { name: "Initial Process Studies",                      levels: [false, false,  true, false,  true] },
        { name: "Qualified Laboratory Documentation",           levels: [false,  true,  true,  true,  true] },
        { name: "Appearance Approval Report",                   levels: [ true,  true,  true,  true,  true] },
        { name: "Sample Production Parts",                      levels: [false,  true,  true,  true,  true] },
        { name: "Master Sample",                                levels: [false, false, false,  true,  true] },
        { name: "Checking Aids",                                levels: [false, false, false,  true,  true] },
        { name: "Customer Specific Requirements",               levels: [false, false, false,  true, false] },
        { name: "Part Submission Warrant",                      levels: [ true,  true,  true,  true,  true] }
    ];

    /** The currently selected documents. */
    selectedDocuments: boolean[];

    /** The note. */
    notes: string[] = [''];
    /** The currently selected additional documents*/
    additionalDocuments: DocumentReference[] = [];

    /** Whether the definition of PPAP is visible or not. */
    showDetails = false;

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                private route: ActivatedRoute,
                private router: Router,
                private documentService: DocumentService,
                private location: Location) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        this.computeSelectedDocuments();

        this.route.queryParams.subscribe(params => {
            if (params["pid"] && this.processMetadata) {
                this.level = 0;
                this.resetSelectedDocumens();
                this.ppap = this.bpDataService.ppap;
                this.notes = this.ppap.note;
                this.additionalDocuments = this.ppap.additionalDocumentReference;
                this.ppap.documentType.forEach(name => {
                    const index = this.DOCUMENTS.findIndex(doc => doc.name === name);
                    if(index >= 0) {
                        this.selectedDocuments[index] = true;
                    }
                });
            }
        });
    }

    isRequestSent(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    areAllDocumentsAvailable(): boolean {
        for(let i = 0; i < this.selectedDocuments.length; i++) {
            if(this.selectedDocuments[i]) {
                const name = this.DOCUMENTS[i].name;
                if(!this.isDocumentAvailable(name)) {
                    return false;
                }
            }
        }

        return true;
    }

    isDocumentAvailable(name: string): boolean {
        return !!this.getCertificate(name);
    }

    onDownload(name: string): void {
        const certificate = this.getCertificate(name);
        if(!certificate) {
            return;
        }
        this.userService.downloadCert(certificate.id);
    }

    private getCertificate(name: string): Certificate | null {
        const settings = this.bpDataService.getCompanySettings();

        for(const certificate of settings.certificates) {
            if(certificate.type === name) {
                return certificate;
            }
        }

        return null;
    }

    onBack() {
        this.location.back();
    }

    onSkip() {
        this.bpDataService.resetBpData();
        this.bpDataService.initRfq(this.bpDataService.getCompanySettings().negotiationSettings).then(() => {
            this.bpDataService.proceedNextBpStep(this.bpDataService.bpStartEvent.userRole, "Negotiation");
        });
    }

    onSendRequest() {
        this.ppap = UBLModelUtils.createPpap([]);
        this.ppap.note = this.notes;
        this.ppap.additionalDocumentReference = this.additionalDocuments;
        this.ppap.documentType = this.DOCUMENTS.filter((_, i) => this.selectedDocuments[i]).map(doc => doc.name);
        this.ppap.lineItem.item = copy(this.bpDataService.modifiedCatalogueLines[0].goodsItem.item);
        UBLModelUtils.removeHjidFieldsFromObject(this.ppap);

        let sellerId = UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty);
        let buyerId = this.cookieService.get("company_id");

        this.callStatus.submit();
        this.userService.getParty(buyerId).then(buyerParty => {
            this.ppap.buyerCustomerParty = new CustomerParty(buyerParty);

            this.userService.getParty(sellerId).then(sellerParty => {
                this.ppap.sellerSupplierParty = new SupplierParty(sellerParty);
                let vars = ModelUtils.createProcessVariables("Ppap", buyerId, sellerId,this.cookieService.get("user_id"), this.ppap, this.bpDataService);
                let piim = new ProcessInstanceInputMessage(vars, "");
                this.bpeService
                    .startBusinessProcess(piim)
                    .then(() => {
                        this.callStatus.callback("Ppap request sent", true);
                        this.router.navigate(["dashboard"]);
                    })
                    .catch(error => {
                        this.callStatus.error("Failed to send Ppap request", error);
                    });
            })
            .catch(error => {
                this.callStatus.error("Failed to send Ppap request", error);
            });
        })
        .catch(error => {
            this.callStatus.error("Failed to send Ppap request", error);
        });
    }

    onUpdateRequest(): void {
        this.callStatus.submit();

        const ppap: Ppap = copy(this.bpDataService.ppap);

        ppap.note = this.notes;
        ppap.additionalDocumentReference = this.additionalDocuments;
        ppap.documentType = this.DOCUMENTS.filter((_, i) => this.selectedDocuments[i]).map(doc => doc.name);

        this.bpeService.updateBusinessProcess(JSON.stringify(ppap),"PPAPREQUEST",this.processMetadata.processId)
            .then(() => {
                this.documentService.updateCachedDocument(ppap.id,ppap);
                this.callStatus.callback("Ppap request updated", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to update Ppap request", error);
            });
    }

    private resetSelectedDocumens() {
        this.selectedDocuments = this.DOCUMENTS.map(() => false);
    }

    private computeSelectedDocuments() {
        this.selectedDocuments = this.DOCUMENTS.map(doc => doc.levels[this.level]);
    }
}
