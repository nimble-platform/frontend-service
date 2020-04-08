/*
 * Copyright 2020
 * AIDIMME - Technological Institute of Metalworking, Furniture, Wood, Packaging and Related sectors; Valencia; Spain
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

import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { SearchInterface, SearchMainAttrInterface, SearchSpecAttrInterface } from '../interfaces/search.interface';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgbDate, NgbModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import * as Globals from '../../globals';
import { SortEvent, NgbdSortableHeader } from '../sortable.directive';
import { DocumentService } from '../document.service';
import { Observable } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { MainAttrInterface, SpecAttrInterface, DocumentInterface } from '../interfaces/document.interface';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from '../../app.component';
import { CookieService } from 'ng2-cookies';
import * as $ from 'jquery';

@Component({
    selector: 'legislation-search',
    templateUrl: './legislation-search.component.html',
    styleUrls: ['./legislation-search.component.css'],
    providers: [DocumentService, DecimalPipe]
})

export class LegislationSearchComponent implements OnInit {

    alerts: any[] = [];
    alert_msg: string = "";

    isCollapsed = false;
    isCollapsedTc = false;
    isCollapsedRt = false;

    search = {
        'mainAttr': {
            'documentId': '',
            'documentType': '',
            'dateEntryFrom': '',
            'dateEntryTo': '',
            'code': '',
            'title': '',
            'description': ''
        } as SearchMainAttrInterface,
        'specAttr': {
            'regulationType': '',
            'regulationNumber': '',
            'descriptors0': '',
            'descriptors1': '',
            'patentCode': '',
            'company': '',
            'scope': '',
            'countriesOfInterest': '',
            'descriptors2': '',
            'authors': '',
            'dateOfDocumentFrom': '',
            'dateOfDocumentTo': '',
            'country': '',
            'descriptors3': ''
        } as SearchSpecAttrInterface,
        "dateEntryFromConv": '',
        "dateEntryToConv": ''
    } as SearchInterface;

    selectedDocumentType = "0";
    maxTitleLength = 140; //max visible chars of title in results
    headElements = ['documentId', 'type', 'code', 'title', 'date'];

    // DETAILS OF DOCUMENT
    selectedDocument = {
        'mainAttr': {
            'documentId': '',
            'documentType': '',
            'dateEntry': '',
            'code': '',
            'title': '',
            'description': ''
        } as MainAttrInterface,
        'specAttr': {
            'regulationType': '',
            'regulationNumber': '',
            'descriptors0': '',
            'descriptors1': '',
            'patentCode': '',
            'company': '',
            'scope': '',
            'countriesOfInterest': '',
            'descriptors2': '',
            'authors': '',
            'dateOfDocument': '',
            'country': '',
            'descriptors3': ''
        } as SpecAttrInterface,
        "dateEntryFromConv": '',
        "dateEntryToConv": ''
    } as DocumentInterface;

    selectedDocumentId = "";
    downloadLink = "";
    datePlaceholder = "";

    // FORMGROUP MAIN FIELDS
    formSearch: FormGroup;

    code = new FormControl("");
    title = new FormControl(null);
    description = new FormControl("");
    dateEntryFrom = new FormControl("");
    dateEntryTo = new FormControl("");

    regulationType = new FormControl("");
    regulationNumber = new FormControl("");
    descriptors0 = new FormControl("");

    dateOfDocumentFrom = new FormControl("");
    dateOfDocumentTo = new FormControl("");

    descriptors1 = new FormControl("");
    authors = new FormControl("");

    descriptors3 = new FormControl("");

    country = new FormControl("");

    // FORMGROUP DETAILS
    seldoc_code = new FormControl("");
    seldoc_title = new FormControl("");
    seldoc_description = new FormControl("");
    seldoc_dateEntry = new FormControl("");

    seldoc_regulationType = new FormControl("");
    seldoc_regulationNumber = new FormControl("");
    seldoc_technicalCommittee = new FormControl("");
    seldoc_editingDate = new FormControl("");
    seldoc_numOfPages = new FormControl("");
    seldoc_language = new FormControl("");
    seldoc_identifyEN = new FormControl("");

    seldoc_legalAssessment = new FormControl("");
    seldoc_link = new FormControl("");
    seldoc_country = new FormControl("");
    seldoc_publicationDate = new FormControl("");
    seldoc_documentOrigin = new FormControl("");

    seldoc_authors = new FormControl("");
    seldoc_dateOfDocument = new FormControl("");
    seldoc_descriptors = new FormControl("");

    sortByAttr = new FormControl("");

    // ADDITIONAL PROPS
    editingDateFrom = new FormControl("");
    editingDateTo = new FormControl("");

    // CONTROLS FOR SORTING
    searchTermCtrl = new FormControl("");
    pageSizeCtrl = new FormControl("");

    editingDateFromConv = "";
    editingDateToConv = "";

    orMode = "radio1";

    documents$: Observable<DocumentInterface[]>;
    total$: Observable<number>;
    @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;

    constructor(
        private http: HttpClient,
        private router: Router,
        private fb: FormBuilder,
        public docService: DocumentService,
        private translate: TranslateService,
        private appComponent: AppComponent,
        private cookieService: CookieService
    ) {
        this.documents$ = docService.documents$;
        this.total$ = docService.total$;

        this.formSearch = fb.group({
            "code": this.code,
            "title": this.title,
            "description": this.description,
            "dateEntryFrom": this.dateEntryFrom,
            "dateEntryTo": this.dateEntryTo,
            "regulationNumber": this.regulationNumber,
            "regulationType": this.regulationType,
            "descriptors0": this.descriptors0,
            "dateOfDocumentFrom": this.dateOfDocumentFrom,
            "dateOfDocumentTo": this.dateOfDocumentTo,
            "descriptors1": this.descriptors1,
            "authors": this.authors,
            "descriptors3": this.descriptors3,

            "seldoc_code": this.seldoc_code,
            "seldoc_title": this.seldoc_title,
            "seldoc_description": this.seldoc_description,
            "seldoc_dateEntry": this.seldoc_dateEntry,
            "seldoc_regulationType": this.seldoc_regulationType,
            "seldoc_regulationNumber": this.seldoc_regulationNumber,
            "seldoc_technicalCommittee": this.seldoc_technicalCommittee,
            "seldoc_editingDate": this.seldoc_editingDate,
            "seldoc_numOfPages": this.seldoc_numOfPages,
            "seldoc_language": this.seldoc_language,
            "seldoc_identifyEN": this.seldoc_identifyEN,
            "seldoc_legalAssessment": this.seldoc_legalAssessment,
            "seldoc_country": this.seldoc_country,
            "seldoc_publicationDate": this.seldoc_publicationDate,
            "seldoc_documentOrigin": this.seldoc_documentOrigin,
            "seldoc_authors": this.seldoc_authors,
            "seldoc_dateOfDocument": this.seldoc_dateOfDocument,
            "seldoc_descriptors": this.seldoc_descriptors,

            "sortByAttr": this.sortByAttr,

            "searchTermCtrl": this.searchTermCtrl,
            "pageSizeCtrl": this.pageSizeCtrl,

            orMode: ['radio1', [Validators.required]]
        });
    }


    ngOnInit() {

        this.setVisibleCard("0");

        this.datePlaceholder = Globals.config.legislationSettings.datePlaceholder;

        const initDate: NgbDateStruct = null;
        this.dateEntryFrom.setValue(initDate);
        this.dateEntryTo.setValue(initDate);
        this.dateOfDocumentFrom.setValue(initDate);
        this.dateOfDocumentTo.setValue(initDate);

    }

    searchDocuments() {
        $('#cardDocumentDetails').fadeOut('slow');

        var url = Globals.legislation_endpoint + "/rest/search/query";

        var queryMainAttr = {
            documentType: this.search.mainAttr.documentType,
            code: this.code.value,
            title: this.title.value,
            description: this.description.value,
            dateEntry: ''
        };
        $.each(queryMainAttr, function(key, value) {
            if (value === "" || value === null) {
                delete queryMainAttr[key];
            }
        });

        if ((this.dateEntryFrom.value != '') && (this.dateEntryTo.value != '') && (this.dateEntryFrom.value != null) && (this.dateEntryTo.value != null)) {
            var dateEntryFromConv = this.convDate(this.dateEntryFrom.value);
            var dateEntryToConv = this.convDate(this.dateEntryTo.value);
            queryMainAttr.dateEntry = [dateEntryFromConv, dateEntryToConv].join(",");
        }

        var querySpecAttr = this.setSpecAttr(this.selectedDocumentType);
        $.each(querySpecAttr, function(key, value) {
            if (value === "" || value === null) {
                delete querySpecAttr[key];
            }
        });

        var qs1 = $.param(queryMainAttr);
        var qs2 = $.param(querySpecAttr);
        var qs = "?" + qs1 + "&" + qs2;

        if (this.formSearch.get('orMode').value == 'radio2') {
            qs += "&ormode=true";
        }

        const params = new HttpParams()
            .set('aToken', 'Bearer ' + this.cookieService.get("bearer_token"))
            .set('authMode', Globals.config.legislationSettings.authMode);

        this.appComponent.loading = true;
        this.http.get(url + qs, { params }).subscribe(
            (res: any[]) => {
                this.docService.DOCUS = res;
                this.docService.sortColumn = "documentId";
                if (res.length > 0) {
                    this.alert_msg = "Results loaded succesfully";
                    $('#cardResults').fadeIn('slow');
                    this.scrollToResults();
                } else {
                    this.alert_msg = "No documents found";
                }

                this.alerts = [];

                this.appComponent.translate.get(this.alert_msg).subscribe((res: string) => {
                    this.alert_msg = res;
                    this.alerts.push({
                        type: 'success',
                        message: this.alert_msg,
                    });
                });

                this.appComponent.loading = false;
            },
            error => {
                var msg: string = "";
                if (error.error != null)
                    msg = error.error.description;
                else
                    msg = error.message;
                this.alert_msg = msg;
                this.docService.DOCUS = [];
                this.alerts = [];
                this.alerts.push({
                    type: 'danger',
                    message: msg,
                });
                this.appComponent.loading = false;
            }
        );

    }

    setSpecAttr(docType: string) {
        var querySpecAttr;
        switch (docType) {
            case "0":
                //Regulation
                querySpecAttr = {
                    regulationType: this.regulationType.value,
                    regulationNumber: this.regulationNumber.value,
                    descriptors: this.descriptors0.value,
                };
                break;
            case "1":
                //Legislation
                querySpecAttr = {
                    descriptors: this.descriptors1.value
                };
                break;
            case "2":
                //Patent
                break;
            case "3":
                //Report
                querySpecAttr = {
                    authors: this.authors.value,
                    country: this.country.value,
                    descriptors: this.descriptors3.value
                };
                if ((this.dateOfDocumentFrom.value != '') && (this.dateOfDocumentTo.value != '') && (this.dateOfDocumentFrom.value != null) && (this.dateOfDocumentTo.value != null)) {
                    var dateOfDocumentFromConv = this.convDate(this.dateOfDocumentFrom.value);
                    var dateOfDocumentToConv = this.convDate(this.dateOfDocumentTo.value);
                    querySpecAttr.dateOfDocument = [dateOfDocumentFromConv, dateOfDocumentToConv].join(",");
                }
                break;
            default:
                break;
        }
        return querySpecAttr;
    }

    convDate(date: any) {
        return date.year + "-" + date.month + "-" + date.day;
    }

    setVisibleCard(docType: string) {
        this.selectedDocumentType = docType;
        this.alerts = [];
        $('#cardResults').fadeOut('slow');
        $('#cardDocumentDetails').fadeOut('slow');
        $('#cardAttr0').hide();
        $('#cardAttr1').hide();
        $('#cardAttr2').hide();
        $('#cardAttr3').hide();
        $('.btn-group .btn').removeClass('btn-nimblered');
        $('.btn-group .btn').addClass('btn-secondary');
        switch (docType) {
            case "0":
                this.search.mainAttr.documentType = "regulation";
                $('#cardAttr0').fadeIn('slow');
                $('#btn0').removeClass('btn-secondary');
                $('#btn0').addClass('btn-nimblered');
                break;
            case "1":
                this.search.mainAttr.documentType = "legislation";
                $('#cardAttr1').fadeIn('slow');
                $('#btn1').removeClass('btn-secondary');
                $('#btn1').addClass('btn-nimblered');
                break;
            case "2":
                //Patent
                break;
            case "3":
                this.search.mainAttr.documentType = "report";
                $('#cardAttr3').fadeIn('slow');
                $('#btn3').removeClass('btn-secondary');
                $('#btn3').addClass('btn-nimblered');
                break;
            default:
                break;
        }
    }

    // RESULTS OF SEARCH

    scrollToResults() {
        $('html, body').animate({
            scrollTop: $("#cardResults").offset().top
        }, 1000);
    }

    scrollToSearch() {
        $('#cardResults').fadeOut('slow');
        $('#cardDocumentDetails').fadeOut('slow');
        window.scrollTo(0, 0);
    }

    scrollToDetails() {
        $('html, body').animate({
            scrollTop: $("#cardDocumentDetails").offset().top
        }, 1000);
    }

    loadDocumentDetails(idDoc: string) {
        this.selectedDocumentId = idDoc;

        var docType = this.selectedDocumentType;
        var attrList = this.fillAttrbsToRetrieve(docType);

        var url = Globals.legislation_endpoint + "/rest/document/get/" + idDoc + "/" + attrList;

        const params = new HttpParams()
            .set('aToken', 'Bearer ' + this.cookieService.get("bearer_token"))
            .set('authMode', Globals.config.legislationSettings.authMode);

        this.appComponent.loading = true;
        this.http.get(url, { params }).subscribe(
            (res: any[]) => {
                this.selectedDocument = res as DocumentInterface;

                this.seldoc_code.setValue(this.selectedDocument.mainAttr.code);
                this.seldoc_title.setValue(this.selectedDocument.mainAttr.title);
                this.seldoc_description.setValue(this.stripHtml(this.selectedDocument.mainAttr.description));
                this.seldoc_dateEntry.setValue(this.formatOutDate(this.selectedDocument.mainAttr.dateEntry));

                this.seldoc_regulationType.setValue(this.selectedDocument.specAttr.regulationType);
                this.seldoc_regulationNumber.setValue(this.selectedDocument.specAttr.regulationNumber);
                this.seldoc_technicalCommittee.setValue(this.selectedDocument.specAttr.technicalCommittee);

                this.seldoc_editingDate.setValue(this.selectedDocument.specAttr.editingDate);
                this.seldoc_numOfPages.setValue(this.selectedDocument.specAttr.numOfPages);
                this.seldoc_language.setValue(this.selectedDocument.specAttr.language);
                this.seldoc_identifyEN.setValue(this.selectedDocument.specAttr.identifyEN);
                this.seldoc_legalAssessment.setValue(this.selectedDocument.specAttr.legalAssessment);
                this.seldoc_link.setValue(this.selectedDocument.specAttr.link);

                this.seldoc_country.setValue(this.selectedDocument.specAttr.country);
                this.seldoc_publicationDate.setValue(this.selectedDocument.specAttr.publicationDate);
                this.seldoc_documentOrigin.setValue(this.selectedDocument.specAttr.documentOrigin);
                this.seldoc_authors.setValue(this.selectedDocument.specAttr.authors);
                this.seldoc_dateOfDocument.setValue(this.selectedDocument.specAttr.dateOfDocument);

                this.seldoc_descriptors.setValue(this.selectedDocument.specAttr.descriptors);

                /* Fix some properties */

                this.scrollToDetails();

                this.alerts = [];

                this.alert_msg = 'Document loaded succesfully';
                this.appComponent.translate.get(this.alert_msg).subscribe((res: string) => {
                    this.alert_msg = res;
                    this.alerts.push({
                        type: 'success',
                        message: this.alert_msg,
                    });
                });

                /* Make visible the chunk of properties associated to the selectedDocumentType */
                $('#cardDocumentDetails').fadeIn('slow');
                this.setVisibleDetailsChunk(docType);

                this.appComponent.loading = false;
            },
            error => {
                var msg: string = "";
                if (error.error != null)
                    msg = error.error.description;
                else
                    msg = error.message;
                this.alert_msg = msg;
                this.alerts = [];
                this.alerts.push({
                    type: 'danger',
                    message: msg,
                });
                this.appComponent.loading = false;
            }
        );

        $('#cardDocumentDetails').fadeIn('slow');
    }

    fillAttrbsToRetrieve(docType: string) {
        var attrList = "";

        switch (docType) {
            case "0":
                //Regulation
                attrList = "regulationType,regulationNumber,descriptors," +
                    "technicalCommittee,editingDate,numOfPages,language,country,identifyEN";
                break;
            case "1":
                //Legislation
                attrList = "descriptors,legalAssessment,link,country,publicationDate,documentOrigin";
                break;
            case "2":
                //Patent
                break;
            case "3":
                //Report
                attrList = "authors,dateOfDocument,country,descriptors";
                break;
            default:
                break;
        }
        return attrList;
    }

    setVisibleDetailsChunk(docType: string) {
        for (var i = 0; i < 4; i++) {
            $('#detailsChunk' + i).addClass('d-none');
        }

        $('#detailsChunk' + docType).removeClass('d-none');
    }

    onSort({ column, direction }: SortEvent) {
        // resetting other headers
        this.headers.forEach(header => {
            if (header.sortable !== column) {
                header.direction = '';
            }
        });

        this.docService.sortColumn = column;
        this.docService.sortDirection = direction;
    }

    avoidEmptyParams() {
        this.search.mainAttr.dateEntryFrom = this.makeNullIfEmpty(this.search.mainAttr.dateEntryFrom);

        this.search.mainAttr.dateEntryTo = this.makeNullIfEmpty(this.search.mainAttr.dateEntryTo);

        this.search.mainAttr.code = this.makeNullIfEmpty(this.search.mainAttr.code);
        this.search.mainAttr.title = this.makeNullIfEmpty(this.search.mainAttr.title);

        this.search.mainAttr.description = this.makeNullIfEmpty(this.search.mainAttr.description);

        this.search.dateEntryFromConv = this.makeNullIfEmpty(this.search.dateEntryFromConv);
        this.search.dateEntryToConv = this.makeNullIfEmpty(this.search.dateEntryToConv);

        this.search.specAttr.regulationType = this.makeNullIfEmpty(this.search.specAttr.regulationType);
        this.search.specAttr.regulationNumber = this.makeNullIfEmpty(this.search.specAttr.regulationNumber);

        this.search.specAttr.descriptors0 = this.makeNullIfEmpty(this.search.specAttr.descriptors0);
        this.search.specAttr.descriptors1 = this.makeNullIfEmpty(this.search.specAttr.descriptors1);
        this.search.specAttr.patentCode = this.makeNullIfEmpty(this.search.specAttr.patentCode);
        this.search.specAttr.company = this.makeNullIfEmpty(this.search.specAttr.company);
        this.search.specAttr.scope = this.makeNullIfEmpty(this.search.specAttr.scope);
        this.search.specAttr.countriesOfInterest = this.makeNullIfEmpty(this.search.specAttr.countriesOfInterest);
        this.search.specAttr.descriptors2 = this.makeNullIfEmpty(this.search.specAttr.descriptors2);
        this.search.specAttr.authors = this.makeNullIfEmpty(this.search.specAttr.authors);

        this.search.specAttr.dateOfDocumentFrom = this.makeNullIfEmpty(this.search.specAttr.dateOfDocumentFrom);
        this.search.specAttr.dateOfDocumentTo = this.makeNullIfEmpty(this.search.specAttr.dateOfDocumentTo);

        this.search.specAttr.country = this.makeNullIfEmpty(this.search.specAttr.country);
        this.search.specAttr.descriptors3 = this.makeNullIfEmpty(this.search.specAttr.descriptors3);
    }

    makeNullIfEmpty(param: string) {
        if ((param == "") || (param == "--") || (param == undefined)) {
            return null;
        } else {
            return param;
        }
    }

    truncateText(text: string) {
        if (text.length > this.maxTitleLength) {
            var myTruncatedText = text.substring(0, this.maxTitleLength);
            return myTruncatedText + "...";
        } else {
            return text;
        }
    }

    formatOutDate(date: string) {
        /*
        * Dates returned from server are formatted "yyyy-mm-dd hh:MM:ss"
        * They should be converted to var dateFormat = "dd-mm-yyyy"
        */
        if (date != null && date != undefined) {
            var posBlank = date.indexOf(" ");
            if (posBlank != -1) {
                date = date.substring(0, posBlank);
            }

            const [year, month, day] = date.split("-");

            var dateOut = Globals.config.legislationSettings.datePlaceholder;
            var dateOut = dateOut.replace("yyyy", year);
            var dateOut = dateOut.replace("mm", month);
            var dateOut = dateOut.replace("dd", day);

            return dateOut;
        } else {
            return "";
        }
    }

    generateDownloadLink(idDoc: string, urldocu: string, docType: string) {
        var path = "";

        switch (docType) {
            case "0":
                /* Normative */
                path = "AdaptingDocuments\\Conocimiento%5CFondo+Documental%5CNormativa\\";
                break;
            case "1":
                /* Legislation */
                break;
            case "3":
                /* Report */
                path = "AdaptingDocuments\\Conocimiento%5CFondo+Documental%5CInformes+Sectoriales\\";
                break;
            default:
                break;
        }

        var dl = "http://aidimadocs.aidima.es/AdaptingDocuments/adminis/busqueda/DescargaDocumento.asp" +
            "?IdDocumento=" + idDoc + "&doc=" + urldocu + "&path=" + path;

        if (urldocu == null) {
            return "empty";
        }
        return dl;
    }

    showDocumentType(docType: string) {
        switch (docType) {
            case "0":
                return "Normative";
            case "1":
                return "Legislation";
            case "2":
                return "Patent";
            case "3":
                return "Report";
            default:
                break;
        }
    }

    getDocumentTypeClass(docType: string) {
        switch (docType) {
            case "0":
                return "fa fa-book-open doc-icon";
            case "1":
                return "fa fa-balance-scale doc-icon";
            case "2":
                return "fa fa-copyright doc-icon";
            case "3":
                return "fa fa-chart-pie doc-icon";
            default:
                break;
        }
    }

    onDateSelect($event) {
    }

    onOptionsItemsPerPageChange(value: number) {
        this.docService.pageSize = value;
    }

    onInputFullTextchange(value: string) {
        this.docService.searchTerm = value;
    }

    stripHtml(html: string) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    closeAlert(alert) {
        this.alerts.splice(this.alerts.indexOf(alert), 1);
    }

}
