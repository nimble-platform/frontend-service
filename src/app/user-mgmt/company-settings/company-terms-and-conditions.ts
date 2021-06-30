/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { AppComponent } from "../../app.component";
import { CompanySettings } from '../model/company-settings';
import { TradingTerm } from '../../catalogue/model/publish/trading-term';
import { deliveryPeriodUnitListId, warrantyPeriodUnitListId } from '../../common/constants';
import { Clause } from '../../catalogue/model/publish/clause';
import { CallStatus } from '../../common/call-status';
import { copy } from '../../common/utils';
import { UnitService } from '../../common/unit-service';
import { BPEService } from '../../bpe/bpe.service';
import { EditTradingTermModalComponent } from './edit-trading-term-modal.component';
import { Text } from '../../catalogue/model/publish/text';
import { TradingPreferences } from '../../catalogue/model/publish/trading-preferences';
import { UserService } from '../user.service';
import { TranslateService } from '@ngx-translate/core';
import {FEDERATIONID, LANGUAGES} from '../../catalogue/model/constants';
import {CatalogueService} from '../../catalogue/catalogue.service';
import {UBLModelUtils} from '../../catalogue/model/ubl-model-utils';
import {CountryUtil} from '../../common/country-util';
import {config} from '../../globals';

@Component({
    selector: "company-terms-and-conditions",
    templateUrl: "./company-terms-and-conditions.html",
    styleUrls: ["./company-terms-and-conditions.css"]
})
export class CompanyTermsAndConditions implements OnInit {

    @Input() settings: CompanySettings = null;
    // if catalogueId is available, then we are editing T&Cs for the given catalogue
    @Input() catalogueId = null;
    @Input() catalogueUuid = null;
    @Output() onSaveEvent: EventEmitter<void> = new EventEmitter();
    // keeps the type of terms and conditions
    // if it is true, the users are allowed to add files as terms and conditions
    // otherwise, the users are allowed to add/select clauses as terms and conditions
    showFileInput: boolean = false;

    initPageStatus: CallStatus = new CallStatus();
    callStatus: CallStatus = new CallStatus();

    // default terms and conditions which are retrieved from the server
    defaultTermsAndConditions: Clause[] = null;

    // terms and conditions of the company
    termsAndConditions: Clause[] = [];

    // clause id-boolean map
    showSection: Map<string, boolean> = new Map<string, boolean>();

    // options
    INCOTERMS: string[] = [];
    PAYMENT_TERMS: string[] = [];
    COUNTRY_JSON = CountryUtil.COUNTRY_JSON;
    UNITS: string[] = [];

    LANGUAGES = LANGUAGES;

    enableTermsAndConditionsAsFile = config.enableTermsAndConditionsAsFile;
    @ViewChild(EditTradingTermModalComponent)
    private editTradingTermModelComponent: EditTradingTermModalComponent;
    // Emit an event when the contract creation is completed (either it is successfully saved or the user wants to cancel it and go back)
    @Output() onContractCreationCompleted: EventEmitter<any> = new EventEmitter<any>();

    constructor(public route: ActivatedRoute,
                public userService: UserService,
                public appComponent: AppComponent,
                public unitService: UnitService,
                public catalogueService: CatalogueService,
                private router: Router,
                private translate: TranslateService,
                public bpeService: BPEService) {

    }

    ngOnInit(): void {
        this.initPageStatus.submit();

        Promise.all([
            this.unitService.getCachedUnitList(deliveryPeriodUnitListId),
            this.unitService.getCachedUnitList(warrantyPeriodUnitListId),
            this.bpeService.getTermsAndConditions(null, FEDERATIONID(), this.settings.companyID, null, null, this.settings.negotiationSettings.company.federationInstanceID),
            this.catalogueUuid ? this.catalogueService.getContractForCatalogue([this.catalogueUuid]):Promise.resolve(null)
        ]).then(([deliveryPeriodUnits, warrantyPeriodUnits, defaultTermsAndConditions, catalogTermsAndConditionsMap]) => {

            // populate available incoterms
            this.INCOTERMS = this.settings.negotiationSettings.incoterms;
            // populate available payment terms
            this.PAYMENT_TERMS = this.settings.negotiationSettings.paymentTerms;
            // populate available units
            this.UNITS = deliveryPeriodUnits.concat(warrantyPeriodUnits);

            // set the default terms and conditions
            if (defaultTermsAndConditions) {
                this.defaultTermsAndConditions = defaultTermsAndConditions;
                // update the clause ids
                this.processClausesForValidity(this.defaultTermsAndConditions);
            }

            // create sales terms if the company does not have any
            if (!this.settings.negotiationSettings.company.salesTerms) {
                this.settings.negotiationSettings.company.salesTerms = new TradingPreferences();
            }

            // if the company has some terms and conditions file, show the file input
            // the file input is not available if the contract generator is being used for catalogues
            if(!this.catalogueId && this.settings.negotiationSettings.company.salesTerms.documentReference && this.settings.negotiationSettings.company.salesTerms.documentReference.length){
                this.showFileInput = true;
            }

            // copy the terms and conditions
            this.termsAndConditions = copy(this.settings.negotiationSettings.company.salesTerms.termOrCondition);

            // if T&Cs are available for the catalog, use them
            if(catalogTermsAndConditionsMap && catalogTermsAndConditionsMap[this.catalogueUuid] && catalogTermsAndConditionsMap[this.catalogueUuid].length > 0){
                this.termsAndConditions = copy(catalogTermsAndConditionsMap[this.catalogueUuid]);
            }

            // sort terms and conditions
            this.termsAndConditions.sort((clause1, clause2) => {
                let order1 = Number(clause1.id.substring(0, clause1.id.indexOf("_")));
                let order2 = Number(clause2.id.substring(0, clause2.id.indexOf("_")));
                return order1 - order2;
            });
            // update the clause ids
            this.processClausesForValidity(this.termsAndConditions);

            this.initPageStatus.callback("Successfully initialized the page", true);
        }).catch(error => {
            this.initPageStatus.error("Error while initializing the page", error);
        });
    }

    // called when the user selects a clause among the default ones
    onClauseSelection(clause: Clause, isChecked: boolean) {
        if (isChecked) {
            // add clause
            this.termsAndConditions.push(clause);
            // update the showSection map
            this.showSection.set(clause.id, false);
        }
        else {
            // remove clause
            this.onRemoveClause(clause);
        }
    }

    // used to update clause content on UI
    setSectionText(clause: Clause) {
        clause.content.forEach(content => {
            // get the clause content
            let text = content.value;
            // get the element representing the clause content
            let element = document.getElementById(clause.id+'-'+content.languageID);
            // replace placeholders with spans
            for (let tradingTerm of clause.tradingTerms) {
                let id = tradingTerm.id;

                text = text.replace(new RegExp("\\" + id, 'g'), "<b><span id='" + clause.id + "-" + id + "'>" + id + "</span></b>");

            }
            // update the element's innerHTML
            element.innerHTML = text;

            // make every trading term id non-editable
            for (let tradingTerm of clause.tradingTerms) {
                let id = tradingTerm.id;

                element = document.getElementById(clause.id + "-" + id);

                element.contentEditable = "false";
            }
        });
    }

    // this method is called when the user changes the content of clause
    onContentUpdated(clause: Clause, event: any, contentIndex:number) {
        // check whether the parameters are deleted or not
        for (let tradingTerm of clause.tradingTerms) {
            if (event.target.innerText.indexOf(tradingTerm.id) == -1) {
                // since there is a missing trading term, we need to set section text again
                this.setSectionText(clause);
                return;
            }
        }
        clause.content[contentIndex].value = event.target.innerText;
    }

    // methods used to add/edit/remove trading terms
    onAddTradingTerm(clause: Clause) {
        let elements = [];
        clause.content.forEach(content => elements.push(document.getElementById(clause.id + "-" + content.languageID)));
        this.editTradingTermModelComponent.open(clause.tradingTerms, clause, elements, this.getExistingTradingTermIds());
    }

    onEditTradingTerm(clause: Clause, tradingTerm: TradingTerm) {
        let elements = [];
        clause.content.forEach(content => elements.push(document.getElementById(clause.id + "-" + content.languageID)));
        this.editTradingTermModelComponent.open(clause.tradingTerms, clause, elements, this.getExistingTradingTermIds(), tradingTerm);
    }

    getExistingTradingTermIds(): string[] {
        let tradingTermIds = [];
        for (let clause of this.termsAndConditions) {
            for (let tradingTerm of clause.tradingTerms) {
                tradingTermIds.push(tradingTerm.id);
            }
        }
        return tradingTermIds;
    }

    onRemoveTradingTerm(clause: Clause, tradingTerm: TradingTerm) {
        // remove trading term from the clause
        clause.tradingTerms.splice(clause.tradingTerms.indexOf(tradingTerm), 1);
        // remove trading term id from the clause content
        clause.content[0].value = clause.content[0].value.replace(new RegExp("\\" + tradingTerm.id, 'g'), "");
        // update the content of corresponding section
        this.setSectionText(clause);
    }

    // used to set the value of trading terms whose data type is NUMBER
    setValueDecimal(tradingTerm: TradingTerm, i: number, event: any) {
        tradingTerm.value.valueDecimal[i] = event.target.value;
    }

    // methods used to add/remove clause
    onAddClause() {
        let clause = new Clause();
        // set the id of clause
        clause.id = UBLModelUtils.generateUUID();
        // set the content and title of clause
        let availableLanguages = this.getAvailableLanguagesForClauseContent(clause.content);
        let clauseLanguage = availableLanguages.indexOf(this.translate.currentLang) != -1 ? this.translate.currentLang : (availableLanguages.indexOf(this.translate.defaultLang) != -1 ? this.translate.defaultLang : availableLanguages[0]);
        clause.content[0] = new Text(null,availableLanguages[0]);
        clause.clauseTitle[0] = new Text(this.translate.instant('Clause Title'),clauseLanguage);
        // add clause
        this.termsAndConditions.push(clause);
        // update the showSection map
        this.showSection.set(clause.id, false);
    }

    // method to add content for the given clause
    onAddClauseContent(clause:Clause) {
        let availableLanguages = this.getAvailableLanguagesForClauseContent(clause.content);
        let clauseLanguage = availableLanguages.indexOf(this.translate.currentLang) != -1 ? this.translate.currentLang : (availableLanguages.indexOf(this.translate.defaultLang) != -1 ? this.translate.defaultLang : availableLanguages[0]);
        clause.content.push(new Text(null,clauseLanguage));
        clause.clauseTitle.push(new Text(null,clauseLanguage));
    }
    onRemoveClauseContent(clause:Clause,contentIndex:number){
        clause.content.splice(contentIndex,1);
        clause.clauseTitle.splice(contentIndex,1);
    }

    onRemoveClause(clause: Clause) {
        let index = this.termsAndConditions.findIndex(selectedClause => selectedClause.id == clause.id);
        // remove clause
        this.termsAndConditions.splice(index, 1);
        // update the showSection map
        this.showSection.delete(clause.id);

        // update the value of checkbox
        let checkbox = <HTMLInputElement>document.getElementById("default-" + clause.id);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    onSave() {
        this.callStatus.submit();
        // each clause should a have number at the beginning of clause id
        // we use these numbers to sort clauses
        let termsAndConditions = copy(this.termsAndConditions);
        // check uniqueness of clauses
        let errorMessage = this.checkValidityOfClauses(termsAndConditions);
        if(errorMessage != null){
            this.callStatus.error(errorMessage);
            return;
        }
        this.addOrderNumberForClauses(termsAndConditions);
        if(this.catalogueUuid){
            this.catalogueService
                .setContractForCatalogue(this.catalogueUuid, termsAndConditions)
                .then(() => {
                    this.callStatus.callback("Done saving terms and conditions for the catalogue", true);
                    alert(this.translate.instant("Successfully saved. You are now getting redirected."));
                    this.onContractCreationCompleted.emit(null);
                })
                .catch(error => {
                    this.callStatus.error("Error while saving terms and conditions for the catalogue.", error);
                });
        } else{
            // copy the negotiation settings
            let negotiationSettingsCopy = copy(this.settings.negotiationSettings);
            // set the terms and conditions
            negotiationSettingsCopy.company.salesTerms.termOrCondition = termsAndConditions;
            this.userService
                .putCompanyNegotiationSettings(negotiationSettingsCopy, this.settings.companyID)
                .then(() => {
                    // update company negotiation settings
                    this.settings.negotiationSettings = copy(negotiationSettingsCopy);
                    this.callStatus.callback("Done saving company negotiation settings", true);
                })
                .catch(error => {
                    this.callStatus.error("Error while saving company negotiation settings.", error);
                });
        }
    }

    onBack(){
        this.onContractCreationCompleted.emit(null);
    }

    checkValidityOfClauses(clauses: Clause[]): string {
        let clauseIds = [];
        for(let clause of clauses){
            if(clause.id == null || clause.id == ""){
                return "Each clause should have an id.";
            }
            else if (clauseIds.indexOf(clause.id) != -1) {
                return "Each clause should have unique id.";
            }
            let contentsWithNoTitles = clause.clauseTitle.filter(title => title.value == null || title.value == '');
            if(contentsWithNoTitles.length > 0){
                return "Each clause content should have a title";
            }
            clauseIds.push(clause.id);
        }
        return null;
    }


    processClausesForValidity(clauses: Clause[]) {
        for (let clause of clauses) {
            // update the clause id by removing the number at the beginning of id
            // this number represents the order.
            let startIndex = clause.id.indexOf("_");
            clause.id = clause.id.substring(startIndex + 1);
            // make sure that content title has the same order with the content in terms of language ids
            let contentTitles = [];
            clause.content.forEach(content => {
                contentTitles = contentTitles.concat(clause.clauseTitle.find(clauseTitle => clauseTitle.languageID == content.languageID));
            });
            clause.clauseTitle = contentTitles;
        }
    }

    getAvailableLanguagesForClauseContent(contents:Text[]){
        let languageIds = contents.map(content => content.languageID);
        return this.LANGUAGES.filter(languageId => languageIds.indexOf(languageId) == -1);
    }
    addOrderNumberForClauses(termsAndConditions: Clause[]) {
        let size = termsAndConditions.length;
        for (let index = 0; index < size; index++) {
            termsAndConditions[index].id = index + 1 + "_" + termsAndConditions[index].id;
        }
    }

    // check whether the given clause is selected or not
    isClauseSelected(clauseId: string) {
        for (let clause of this.termsAndConditions) {
            if (clause.id == clauseId) {
                return true;
            }
        }
        return false;
    }

    getClauseName(clause:Clause){
        let titleIndex = clause.clauseTitle.findIndex(title => title.languageID == this.translate.currentLang);
        if(titleIndex == -1){
            titleIndex = clause.clauseTitle.findIndex(title => title.languageID == "en");
            if(titleIndex == -1){
                titleIndex = 0;
            }
        }
        return clause.clauseTitle[titleIndex].value;
    }

    onTermsAndConditionsTypeChanged(){
        this.showFileInput = !this.showFileInput;
    }
}
