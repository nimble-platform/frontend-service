/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { Certificate } from "../model/publish/certificate";
import * as myGlobals from '../../globals';
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DocumentReference } from "../model/publish/document-reference";
import { Attachment } from "../model/publish/attachment";
import { BinaryObject } from "../model/publish/binary-object";
import { UBLModelUtils } from "../model/ubl-model-utils";
import { Country } from "../model/publish/country";
import { Text } from "../model/publish/text";
import { Observable } from "rxjs";
import { debounceTime, distinctUntilChanged, map } from "rxjs/operators";
import { TranslateService } from '@ngx-translate/core';
import {config} from '../../globals';
import {CountryUtil} from '../../common/country-util';
import {Code} from '../model/publish/code';

@Component({
    selector: "product-certificates-tab",
    templateUrl: "./product-certificates-tab.component.html",
    styleUrls: ["./product-certificates-tab.component.css"]
})
export class ProductCertificatesTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean;

    addCertForm: FormGroup;
    countryFormControl: FormControl;
    config = myGlobals.config;
    selectedFiles: BinaryObject[] = [];
    selectedCountries: string[] = [];
    updateMode: 'add' | 'edit';

    arbitraryCertificates: Certificate[];
    circularEconomyCertificates: Certificate[];
    certificateFilesProvided = false;
    editedCertificate: Certificate;
    // group of the certificate being added or edited
    certificateGroup: 'arbitrary' | 'circularEconomy';

    constructor(private _fb: FormBuilder,
        private modalService: NgbModal,
        private translate: TranslateService) {
    }

    ngOnInit() {
        this.updateCertificateLists();
    }

    onEdit(popup, i: number, certificateGroup: 'arbitrary' | 'circularEconomy') {
        this.updateMode = 'edit';
        this.certificateGroup = certificateGroup;
        this.editedCertificate = this.catalogueLine.goodsItem.item.certificate[i];
        this.certificateFilesProvided = true;
        this.addCertForm = this._fb.group({
            name: [this.editedCertificate.certificateTypeCode.name],
            description: [this.editedCertificate.remarks],
            type: [this.editedCertificate.certificateType]
        });
        this.selectedFiles = [];
        for (let docRef of this.editedCertificate.documentReference) {
            this.selectedFiles.push(docRef.attachment.embeddedDocumentBinaryObject);
        }

        this.countryFormControl = new FormControl('');
        this.selectedCountries = [];
        for (let country of this.editedCertificate.country) {
            this.selectedCountries.push(CountryUtil.getCountryByISO(country.identificationCode.value));
        }

        this.modalService.open(popup);
    }

    onDelete(i: number) {
        this.catalogueLine.goodsItem.item.certificate.splice(i, 1);
        this.updateCertificateLists();
    }

    onAddCertificate(content, certificateGroup: 'arbitrary' | 'circularEconomy') {
        this.updateMode = 'add';
        this.certificateGroup = certificateGroup;
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

    removedFile(event: boolean) {
        if (event) {
            if (this.selectedFiles.length == 0) {
                this.certificateFilesProvided = false;
            }
        }
    }

    onCertificateDetailsProvided(model: FormGroup, close: any) {
        const fields = model.getRawValue();
        let certificate: Certificate = new Certificate();
        if (this.updateMode === 'edit') {
            certificate = this.editedCertificate;
        }
        certificate.certificateType = fields.type;
        certificate.remarks = fields.description;
        certificate.certificateTypeCode.name = fields.name;
        certificate.documentReference = [];
        for (let file of this.selectedFiles) {
            certificate.documentReference.push(UBLModelUtils.createDocumentReferenceWithBinaryObject(file));
        }
        certificate.country = [];
        for (let countryName of this.selectedCountries) {
            const countryIso = CountryUtil.getISObyCountry(countryName);

            let country: Country = new Country();
            country.identificationCode = new Code();
            country.identificationCode.value = countryIso;
            certificate.country.push(country);
        }

        if (this.updateMode === 'add') {
            this.catalogueLine.goodsItem.item.certificate.push(certificate);
        }
        this.updateCertificateLists();
        close();
    }

    onCountrySelected(event) {
        this.selectedCountries.push(event.item);
        setTimeout(() => {
            this.countryFormControl.setValue('');
        });
    }

    onCountryRemoved(countryName: string) {
        this.selectedCountries.splice(this.selectedCountries.indexOf(countryName), 1);
        this.countryFormControl.setValue('');
    }

    /*
     template getters
     */

    getSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(50),
            distinctUntilChanged(),
            map(term => CountryUtil.getCountrySuggestions(term))
        );

    getCertificateCountryNames(certificate: Certificate): string[] {
        let countryNames: string[] = [];
        if (certificate.country == null || certificate.country.length == 0) {
            return countryNames;
        }

        for (let country of certificate.country) {
            countryNames.push(CountryUtil.getCountryByISO(country.identificationCode.value));
        }
        return countryNames;
    }

    public getCircularCertificateTypes(): string[] {
        return this.config.circularEconomy.productCertificates;
    }

    private updateCertificateLists(): void {
        this.circularEconomyCertificates = [];
        this.arbitraryCertificates = [];
        this.catalogueLine.goodsItem.item.certificate.forEach(cert => {
            if (cert.certificateType === config.circularEconomy.certificateGroup) {
                this.circularEconomyCertificates.push(cert);
            } else {
                this.arbitraryCertificates.push(cert);
            }
        });
    }
}
