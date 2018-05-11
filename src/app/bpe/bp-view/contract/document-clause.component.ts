import {Component, OnInit} from "@angular/core";
import {ClauseComponent} from "./clause.component";
import {DocumentClause} from "../../../catalogue/model/publish/document-clause";
import {BPEService} from "../../bpe.service";
import {CallStatus} from "../../../common/call-status";
@Component({
    selector: 'document-clause',
    templateUrl: './document-clause.component.html'
})
export class DocumentClauseComponent extends ClauseComponent implements OnInit {
    clauseDocument = null;
    clauseDocumentRetrievalStatus: CallStatus = new CallStatus();

    constructor(private bpeService: BPEService) {
        super();
    }

    ngOnInit(): void {
        if (this.clauseDocument == null) {
            console.log("getting doc");
            let documentClause: DocumentClause = this.clause as DocumentClause;
            this.clauseDocumentRetrievalStatus.submit();
            this.bpeService.getDocumentJsonContent(documentClause.clauseDocumentRef.id).then(result => {
                this.clauseDocumentRetrievalStatus.callback("", true);
                this.clauseDocument = result;
            }).catch(error => {
                this.clauseDocumentRetrievalStatus.error("Failed to retrieve product details");
            });
        }
    }
}
