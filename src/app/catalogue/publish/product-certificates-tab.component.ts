import {Component, OnInit, Input, ViewChild, ElementRef} from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { Certificate } from "../model/publish/certificate";
import * as myGlobals from '../../globals';
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DocumentReference} from "../model/publish/document-reference";
import {Attachment} from "../model/publish/attachment";
import {BinaryObject} from "../model/publish/binary-object";
import {UBLModelUtils} from "../model/ubl-model-utils";
import {COUNTRY_NAMES, getCountrySuggestions, validateCountrySimple} from "../../common/utils";
import {Country} from "../model/publish/country";
import {Text} from "../model/publish/text";
import { Observable } from "rxjs";
import { debounceTime, distinctUntilChanged, map } from "rxjs/operators";
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "product-certificates-tab",
    templateUrl: "./product-certificates-tab.component.html",
    styleUrls: ["./product-certificates-tab.component.css"]
})
export class ProductCertificatesTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    addCertForm: FormGroup;
    countryFormControl: FormControl;
    certificateFilesProvided = false;
    config = myGlobals.config;
    selectedFiles: BinaryObject[] = [];
    selectedCountries: string[] = [];

    constructor(private _fb: FormBuilder,
                private modalService: NgbModal,
                private translate: TranslateService) {
    }

    ngOnInit() {
        // nothing for now
    }

    onEdit(popup, i: number){
        let cert:Certificate = this.catalogueLine.goodsItem.item.certificate[i];
        this.certificateFilesProvided = true;
        this.addCertForm = this._fb.group({
            name: [cert.certificateTypeCode.name],
            description: [cert.remarks],
            type: [cert.certificateType]
        });
        this.selectedFiles = [];
        for(let docRef of cert.documentReference) {
            this.selectedFiles.push(docRef.attachment.embeddedDocumentBinaryObject);
        }

        this.countryFormControl = new FormControl('');
        this.selectedCountries = [];
        for(let country of cert.country) {
            this.selectedCountries.push(country.name.value);
        }

        this.modalService.open(popup);
    }

    onDelete(i: number) {
        this.catalogueLine.goodsItem.item.certificate.splice(i, 1);
    }

    onAddCertificate(content) {
        this.addCertForm = this._fb.group({
            name: [""],
            description: [""],
            type: [""]
        });
        this.certificateFilesProvided = false;
        this.selectedFiles = [];
        this.countryFormControl = new FormControl('');
        this.modalService.open(content);
    }

    onCertificateFileSelected(event: BinaryObject) {
        this.certificateFilesProvided = true;
    }

    removedFile(event:boolean){
        if(event){
            if(this.selectedFiles.length == 0) {
                this.certificateFilesProvided = false;
            }
        }
    }

    onCertificateDetailsProvided(model: FormGroup, close: any) {
        const fields = model.getRawValue();
        let certificate: Certificate = new Certificate();
        certificate.certificateType = fields.type;
        certificate.remarks = fields.description;
        certificate.certificateTypeCode.name = fields.name;
        for(let file of this.selectedFiles) {
            certificate.documentReference.push(UBLModelUtils.createDocumentReferenceWithBinaryObject(file));
        }
        for(let countryName of this.selectedCountries) {
            let country: Country = new Country(new Text(countryName, "en"));
            certificate.country.push(country);
        }
        this.catalogueLine.goodsItem.item.certificate.push(certificate);
        close();
    }

    validateCountry (): boolean {
      return validateCountrySimple(this.countryFormControl.value);
    }

    onCountrySelected() {
        this.selectedCountries.push(this.countryFormControl.value);
        this.countryFormControl.setValue('');
    }

    onCountryRemoved(countryName: string) {
        this.selectedCountries.splice(this.selectedCountries.indexOf(countryName), 1);
        this.countryFormControl.setValue('');
    }

    getSuggestions = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(50),
        distinctUntilChanged(),
        map(term => getCountrySuggestions(term))
      );

    getCertificateCountryNames(certificate:Certificate): string[] {
        let countryNames:string[] = [];
        if(certificate.country == null || certificate.country.length == 0) {
            return countryNames;
        }

        for(let country of certificate.country) {
            countryNames.push(country.name.value);
        }
        return countryNames;
    }
}
