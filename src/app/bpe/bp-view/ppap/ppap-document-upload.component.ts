import {Component} from "@angular/core";
import {Ppap} from "../../../catalogue/model/publish/ppap";
import {PpapResponse} from "../../../catalogue/model/publish/ppap-response";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../../bpe.service";
import {ProcessVariables} from "../../model/process-variables";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {ModelUtils} from "../../model/model-utils";
import {CallStatus} from "../../../common/call-status";
import {ActivatedRoute, Router} from "@angular/router";
import {BinaryObject} from "../../../catalogue/model/publish/binary-object";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
import {Attachment} from "../../../catalogue/model/publish/attachment";
import {ActivityVariableParser} from "../activity-variable-parser";
import { Location } from "@angular/common";

@Component({
    selector: "ppap-document-upload",
    templateUrl: "./ppap-document-upload.component.html",
    styleUrls: ["./ppap-document-upload.component.css"]
})
export class PpapDocumentUploadComponent {

    processid : any;
    ppap : Ppap;
    documents = [];

    ppapResponse : PpapResponse = null;

    ppapDocuments : DocumentReference[] = [];
    note: any;
    noteToSend : any;
    binaryObjects: { documentName: string, documents: BinaryObject[] }[] = [];
    callStatus:CallStatus = new CallStatus();
    // check whether 'Send Response' button is clicked
    submitted: boolean = false;

    constructor(private bpDataService: BPDataService,
        private bpeService: BPEService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location) {
    
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params =>{
            this.processid = params['pid'];

            this.bpeService.getProcessDetailsHistory(this.processid).then(task => {
                this.ppap = ActivityVariableParser.getInitialDocument(task).value as Ppap;
                let i = 0;
                this.documents = [];
                for(;i<this.ppap.documentType.length;i++){
                    this.documents.push(this.ppap.documentType[i]);
                }
                this.note = this.ppap.note;
            });
        });
    }

    onSelectFile(documentName: string, binaryObject: BinaryObject) {
        let document = this.binaryObjects.find(obj => obj.documentName === documentName);
        if(!document) {
            document = { documentName, documents: [] };
            this.binaryObjects.push(document);
        }

        document.documents.push(binaryObject);
    }

    onClearFile(documentName: string, binaryObject: BinaryObject) {
        const document = this.binaryObjects.find(obj => obj.documentName === documentName);
        if(!document) {
            return
        }

        const index = document.documents.indexOf(binaryObject);
        if(index >= 0) {
            document.documents.splice(index, 1);
        }
    }

    onBack() {
        this.location.back();
    }

    isSent(document: string): boolean {
        for(var i = 0; i < this.binaryObjects.length; i++){
            if (document === this.binaryObjects[i].documentName){
                return true;
            }
        }
        return false;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    responseToPpapRequest(acceptedIndicator: boolean) {
        this.submitted = true;
        for(let i=0;i<this.binaryObjects.length;i++){
            for(let j=0;j<this.binaryObjects[i].documents.length;j++){
                let attachment : Attachment = new Attachment(this.binaryObjects[i].documents[j]);
                let documentRef: DocumentReference = new DocumentReference(UBLModelUtils.generateUUID(), this.binaryObjects[i].documentName, attachment);
                this.ppapDocuments.push(documentRef);
            }
        }


        this.ppapResponse = UBLModelUtils.createPpapResponse(this.ppap,acceptedIndicator);
        if(this.ppapDocuments.length == 0){
            this.ppapResponse.requestedDocument = [];
        } else {
            this.ppapResponse.requestedDocument = this.ppapDocuments;
        }

        this.ppapResponse.note = this.noteToSend;
        const vars: ProcessVariables = ModelUtils.createProcessVariables("Ppap", this.ppap.buyerCustomerParty.party.id, this.ppap.sellerSupplierParty.party.id, this.ppapResponse, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim).then(res => {
            this.callStatus.callback("Ppap Response placed", true);
            this.router.navigate(['dashboard']);
        }).catch(error => {
            this.submitted = false;
            error => this.callStatus.error("Failed to send Ppap Response", error)
        });

    }
}
