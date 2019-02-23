import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { Certificate } from "../model/publish/certificate";
import * as myGlobals from '../../globals';
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DocumentReference} from "../model/publish/document-reference";
import {Attachment} from "../model/publish/attachment";
import {BinaryObject} from "../model/publish/binary-object";
import {UBLModelUtils} from "../model/ubl-model-utils";

@Component({
    selector: "product-certificates-tab",
    templateUrl: "./product-certificates-tab.component.html",
    styleUrls: ["./product-certificates-tab.component.css"]
})
export class ProductCertificatesTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    addCertForm: FormGroup;
    config = myGlobals.config;
    certDocumentReference: DocumentReference;

    constructor(private _fb: FormBuilder,
                private modalService: NgbModal) {
    }

    ngOnInit() {
        // nothing for now
    }

    onDelete(i: number) {
        this.catalogueLine.goodsItem.item.certificate.splice(i, 1);
    }

    onAddCertificate(content) {
        this.addCertForm = this._fb.group({
            file: [""],
            name: [""],
            description: [""],
            type: [""]
        });
        this.modalService.open(content);
    }

    onSetCertificateFile(event: BinaryObject) {
        this.certDocumentReference = UBLModelUtils.createDocumentReferenceWithBinaryObject(event);
    }

    onCertificateDetailsProvided(model: FormGroup, close: any) {
        const fields = model.getRawValue();
        let certificate: Certificate = new Certificate();
        certificate.certificateType = fields.type;
        certificate.remarks = fields.description;
        certificate.certificateTypeCode.name = fields.name;
        certificate.documentReference = [this.certDocumentReference];

        this.catalogueLine.goodsItem.item.certificate.push(certificate);
        close();
    }
}
