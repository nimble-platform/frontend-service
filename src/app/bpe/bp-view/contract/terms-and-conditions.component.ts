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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { CallStatus } from "../../../common/call-status";
import { BPEService } from "../../bpe.service";
import { Clause } from '../../../catalogue/model/publish/clause';
import { UserService } from '../../../user-mgmt/user.service';
import { UnitService } from '../../../common/unit-service';
import { deliveryPeriodUnitListId, warrantyPeriodUnitListId } from '../../../common/constants';
import { TradingTerm } from '../../../catalogue/model/publish/trading-term';
import {TranslateService} from '@ngx-translate/core';
import {NegotiationClauseService} from '../negotiation/negotiation-clause-service';
import {Subject} from 'rxjs';
import {CountryUtil} from '../../../common/country-util';
import * as myGlobals from '../../../globals';


@Component({
    selector: "terms-and-conditions",
    templateUrl: "./terms-and-conditions.component.html",
    styleUrls: ["./terms-and-conditions.component.css"]
})
export class TermsAndConditionsComponent implements OnInit, OnDestroy {

    // Inputs
    @Input() sellerPartyId: string;
    @Input() sellerFederationId: string;
    @Input() readOnly: boolean = false;
    @Input() enableComparisonWithOtherTerms: boolean = true; // if true, original and current terms are compared and differences are highlighted
    @Input() documentType: string; // "order", "rfq", "quotation";
    @Input() showActionButton: boolean = false; // if true, an update/view button displayed next to the clause name
    @Input() actionButtonClass:string = "col-2";
    @Input() componentIndex:number = 0; // keeps the order of item included in the negotiation
    _originalTermAndConditionClauses: Clause[] = null; // original terms and conditions of the object
    _termsAndConditions: Clause[] = []; // updated terms and conditions of the object
    config = myGlobals.config;

    // Outputs
    @Output() onIncotermChanged = new EventEmitter();
    @Output() onPaymentMeansChanged = new EventEmitter();
    @Output() onClauseUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();

    callStatus: CallStatus = new CallStatus();

    // used to store values of parameters inside the terms and conditions text
    tradingTerms: Map<string, TradingTerm> = null;
    // used to store original values of parameters
    originalTradingTerms: Map<string, TradingTerm> = null;
    // used as a suffix to be able create html elements (keeping clause text) with unique ids.
    // this is required since the style of html elements are updated within the script.
    randomComponentId: string = '';

    showSection: boolean[] = []; //collapsed state of clauses
    updatedClauseIds: string[] = []; // keeps the identifier of clauses including terms differing than the original terms

    // selected values for Incoterm and Trading Term (e.g. Payment Terms)
    _selectedIncoterm: string = null;
    _selectedTradingTerm: string = null;

    // options
    @Input() availableIncoTerms: string[] = [];
    @Input() availablePaymentTerms: string[] = [];
    COUNTRY_JSON = CountryUtil.COUNTRY_JSON;

    ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public bpeService: BPEService,
                public userService: UserService,
                public translateService: TranslateService,
                public unitService: UnitService,
                public negotiationClauseService:NegotiationClauseService) {

    }

    ngOnInit(): void {
        this.negotiationClauseService.onClauseCollapsed.takeUntil(this.ngUnsubscribe).subscribe(componentClauseId => {
            if(this._termsAndConditions){
                let separatorIndex = componentClauseId.indexOf("-");
                let componentIndex = Number.parseInt(componentClauseId.substring(0,separatorIndex));
                if(this.componentIndex == componentIndex){
                    let clauseId = this.getClauseIdWithoutOrder(componentClauseId.substring(separatorIndex+1));
                    let index = this._termsAndConditions.findIndex(clause => this.getClauseIdWithoutOrder(clause.id) === clauseId);
                    if (index != -1)
                        this.collapseClause(index);
                }

            }
        });
        let array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        this.randomComponentId = "" + array[0];

        if (this.enableComparisonWithOtherTerms && this.sellerPartyId != null) {
            this.callStatus.submit();
            Promise.all([
                this.userService.getSettingsForParty(this.sellerPartyId, this.sellerFederationId),
                this.unitService.getCachedUnitList(deliveryPeriodUnitListId),
                this.unitService.getCachedUnitList(warrantyPeriodUnitListId)

            ]).then(([sellerPartySettings, deliveryPeriodUnits, warrantyPeriodUnits]) => {

                // populate available incoterms
                this.availableIncoTerms = sellerPartySettings.negotiationSettings.incoterms;
                // populate available payment terms
                this.availablePaymentTerms = sellerPartySettings.negotiationSettings.paymentTerms;

                this.callStatus.callback("Successfully fetched terms and conditions", true);
            }).catch(error => {
                this.callStatus.error("Error while fething terms and conditions", error);
            });
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    setSectionText(index: number) {
        let element = document.getElementById(this.generateIdForClause(index));
        let clause = this._termsAndConditions[index];
        let clauseContentIndex = this.getClauseContentIndex(clause);
        let text = clause.content[clauseContentIndex].value;
        if (this.readOnly) {
            for (let tradingTerm of clause.tradingTerms) {
                let id = tradingTerm.id;
                let spanText = "";
                if (this.isSameWithTheOriginalTradingTerm(tradingTerm.id)) {
                    spanText = "<b><span class='" + this.generateClassForParameter(id) + "'>";

                }
                else {
                    spanText = "<b><span style='color: red' class='" + this.generateClassForParameter(id) + "'>";
                }

                let defaultValue = this.getDefaultValue(tradingTerm);
                text = text.replace(new RegExp("\\" + tradingTerm.id, 'g'), spanText + defaultValue + "</span></b>");
            }

            element.innerHTML = text;

        } else {
            // replace placeholders with spans
            for (let tradingTerm of clause.tradingTerms) {
                let id = tradingTerm.id;
                let spanText = "";
                if (this.isSameWithTheOriginalTradingTerm(tradingTerm.id)) {
                    spanText = "<b><span class='" + this.generateClassForParameter(id) + "'>";

                }
                else {
                    spanText = "<b><span style='color: red' class='" + this.generateClassForParameter(id) + "'>";
                }

                let defaultValue = this.getDefaultValue(this.tradingTerms.get(id));
                text = text.replace(new RegExp("\\" + id, 'g'), spanText + defaultValue + "</span></b>");
            }

            element.innerHTML = text;
        }
    }

    updateParameter(sectionIndex: number, id: string, value: string, isUnit: boolean = false) {
        let clause = this.originalTermAndConditionClauses[sectionIndex];
        // handling of empty string
        if (value == "") {

            for (let tradingTerm of clause.tradingTerms) {
                if (tradingTerm.id == id) {
                    let defaultTradingTerm = this.originalTradingTerms.get(id);

                    if (tradingTerm.value.valueQualifier == "STRING") {
                        this.tradingTerms.get(id).value.value[0].value = defaultTradingTerm.value.value[0].value;
                    } else if (tradingTerm.value.valueQualifier == "NUMBER") {
                        this.tradingTerms.get(id).value.valueDecimal[0] = defaultTradingTerm.value.valueDecimal[0];
                    } else if (tradingTerm.value.valueQualifier == "QUANTITY") {
                        this.tradingTerms.get(id).value.valueQuantity[0].value = defaultTradingTerm.value.valueQuantity[0].value;
                        this.tradingTerms.get(id).value.valueQuantity[0].unitCode = defaultTradingTerm.value.valueQuantity[0].unitCode;
                    } else if (tradingTerm.value.valueQualifier == "CODE") {
                        this.tradingTerms.get(id).value.valueCode[0].value = defaultTradingTerm.value.valueCode[0].value;
                    }

                    let elements = document.getElementsByClassName(this.generateClassForParameter(id));
                    if (elements && elements.length > 0) {
                        for (let i = 0; i < elements.length; i++) {
                            let element: HTMLElement = <HTMLElement>elements[i];
                            element.innerText =  this.getDefaultValue(tradingTerm);

                            this.setElementColor(element, id);
                        }
                    }

                    break;
                }
            }
        }
        else {
            // update the value of parameter
            if (isUnit) {
                this.tradingTerms.get(id).value.valueQuantity[0].unitCode = value;

                let elements = document.getElementsByClassName(this.generateClassForParameter(id));
                if (elements && elements.length > 0) {
                    for (let i = 0; i < elements.length; i++) {
                        let element: HTMLElement = <HTMLElement>elements[i];
                        element.innerText = this.tradingTerms.get(id).value.valueQuantity[0].value + " " + value;

                        this.setElementColor(element, id);
                    }
                }

            } else {
                let tradingTerm = this.tradingTerms.get(id);
                if (tradingTerm.value.valueQualifier == "STRING") {
                    tradingTerm.value.value[0].value = value;
                } else if (tradingTerm.value.valueQualifier == "NUMBER") {
                    tradingTerm.value.valueDecimal[0] = Number(value);
                } else if (tradingTerm.value.valueQualifier == "QUANTITY") {
                    tradingTerm.value.valueQuantity[0].value = Number(value);
                } else if (tradingTerm.value.valueQualifier == "CODE") {
                    tradingTerm.value.valueCode[0].value = value;
                    if(tradingTerm.value.valueCode[0].listID == 'COUNTRY_LIST'){
                        value = CountryUtil.getCountryByISO(value);
                    }
                }

                let elements = document.getElementsByClassName(this.generateClassForParameter(id));

                if (elements && elements.length > 0) {
                    let size = elements.length;
                    for (let i = 0; i < size; i++) {
                        let element: HTMLElement = <HTMLElement>elements[i];
                        if (tradingTerm.value.valueQualifier == "QUANTITY") {
                            element.innerText = value + " " + tradingTerm.value.valueQuantity[0].unitCode;
                        } else {
                            element.innerText = value;
                        }

                        this.setElementColor(element, id);
                    }
                }

            }
        }

        // emit the new value if necessary
        if (id == "$incoterms_id") {
            this.onIncotermChanged.emit(value);
        }
        else if (id == "$payment_id") {
            this.onPaymentMeansChanged.emit(value);
        }

        this.checkDifferingUpdate(clause.id);
    }

    checkDifferingUpdate(updatedClauseId: string): void {
        let updatedClause: Clause = this._termsAndConditions.find(clause => clause.id == updatedClauseId);
        let sameWithOriginal: boolean = this.isSameWithTheOriginalClause(updatedClause);

        if (!sameWithOriginal) {
            // store the clause id in the updated clauses list
            let clauseId: number = this.updatedClauseIds.findIndex(id => id == updatedClauseId);
            if (clauseId == -1) {
                this.updatedClauseIds.push(updatedClauseId);
            }
            // emit a clause updated event
            this.onClauseUpdated.emit(true);
            return;

        } else {
            // remove the term from the updated list if it is included there
            let indexToDelete: number = this.updatedClauseIds.findIndex(id => id == updatedClauseId);
            if (indexToDelete != -1) {
                this.updatedClauseIds.splice(indexToDelete, 1);
                // if the update clause id list is empty then notify the parent components about this
                if (this.updatedClauseIds.length == 0) {
                    this.onClauseUpdated.emit(false);
                }
            }
        }
    }

    getClauseName(clause: Clause) {
        return clause.clauseTitle[this.getClauseContentIndex(clause)].value;
    }

    getClauseContentIndex(clause:Clause):number{
        let titleIndex = clause.clauseTitle.findIndex(title => title.languageID == this.translateService.currentLang);
        if(titleIndex == -1){
            titleIndex = clause.clauseTitle.findIndex(title => title.languageID == "en");
            if(titleIndex == -1){
                titleIndex = 0;
            }
        }
        return titleIndex;
    }

    // returns the default value of the given trading term
    // if there is no default value provided for this trading term, then returns its id
    getDefaultValue(tradingTerm: TradingTerm) {
        let defaultValue = null;
        if (tradingTerm.value.valueQualifier == "QUANTITY") {
            defaultValue = tradingTerm.value.valueQuantity[0].value;
            let defaultUnit = tradingTerm.value.valueQuantity[0].unitCode;
            // if value or unit is not provided, then return its id
            if (!defaultValue || !defaultUnit) {
                return tradingTerm.id;
            }
            // else return the default value
            return defaultValue + " " + defaultUnit;

        } else if (tradingTerm.value.valueQualifier == "STRING") {
            defaultValue = tradingTerm.value.value[0].value;
        } else if (tradingTerm.value.valueQualifier == "NUMBER") {
            defaultValue = tradingTerm.value.valueDecimal[0];
        } else if (tradingTerm.value.valueQualifier == "CODE") {
            defaultValue = tradingTerm.value.valueCode[0].value;
            if(tradingTerm.value.valueCode[0].listID == 'COUNTRY_LIST'){
                defaultValue = CountryUtil.getCountryByISO(tradingTerm.value.valueCode[0].value);
            }
        }

        // if there is no default value, return its id
        if (!defaultValue) {
            return tradingTerm.id;
        }
        // return the default value
        return defaultValue
    }

    generateIdForClause(clauseId: number) {
        return this.randomComponentId + "-" + this.documentType + "-" + clauseId;
    }

    generateClassForParameter(parameter: string) {
        return this.documentType + "-" + parameter;
    }

    get selectedIncoterm(): string {
        return this._selectedIncoterm;
    }

    @Input('selectedIncoterm')
    set selectedIncoterm(incoterm: string) {
        this._selectedIncoterm = incoterm;

        let id = "$incoterms_id";
        this.updateTermNegotiating(id, this._selectedIncoterm);
        this.onClauseUpdated.emit(true);
    }

    get selectedTradingTerm(): string {
        return this._selectedTradingTerm;
    }

    @Input('selectedTradingTerm')
    set selectedTradingTerm(tradingTerm: string) {
        this._selectedTradingTerm = tradingTerm;
        this.updateTermNegotiating("$payment_id", tradingTerm);
        this.onClauseUpdated.emit(true);
    }

    @Input()
    set originalTermAndConditionClauses(clauses: Clause[]) {
        this._originalTermAndConditionClauses = clauses;
        this._originalTermAndConditionClauses.sort((clause1, clause2) => {
            let order1 = Number(clause1.id.substring(0, clause1.id.indexOf("_")));
            let order2 = Number(clause2.id.substring(0, clause2.id.indexOf("_")));
            return order1 - order2;
        });
        for (let clause of this._originalTermAndConditionClauses) {
            // make sure that content title has the same order with the content in terms of language ids
            let contentTitles = [];
            clause.content.forEach(content => {
                contentTitles = contentTitles.concat(clause.clauseTitle.find(clauseTitle => clauseTitle.languageID == content.languageID));
            });
            clause.clauseTitle = contentTitles;
        }

        this.originalTradingTerms = new Map<string, TradingTerm>();
        // create tradingTerms map using the original terms and conditions
        for (let clause of this._originalTermAndConditionClauses) {
            for (let tradingTerm of clause.tradingTerms) {
                this.originalTradingTerms.set(tradingTerm.id, tradingTerm);
            }
        }

        // refresh the texts for the open sections, otherwise the panel gets empty
        for (let i = 0; i < this.showSection.length; i++) {
            if (this.showSection[i]) {
                setTimeout(() => {
                    this.setSectionText(i);
                });
            }
        }
    }

    get originalTermAndConditionClauses(): Clause[] {
        return this._originalTermAndConditionClauses;
    }

    @Input()
    set termsAndConditions(clauses: Clause[]) {
        this._termsAndConditions = clauses;

        // sort terms and conditions
        this._termsAndConditions.sort((clause1, clause2) => {
            let order1 = Number(clause1.id.substring(0, clause1.id.indexOf("_")));
            let order2 = Number(clause2.id.substring(0, clause2.id.indexOf("_")));
            return order1 - order2;
        });
        for (let clause of this._termsAndConditions) {
            // make sure that content title has the same order with the content in terms of language ids
            let contentTitles = [];
            clause.content.forEach(content => {
                contentTitles = contentTitles.concat(clause.clauseTitle.find(clauseTitle => clauseTitle.languageID == content.languageID));
            });
            clause.clauseTitle = contentTitles;
        }

        // create valuesOfParameters map
        this.tradingTerms = new Map<string, TradingTerm>();
        // create tradingTerms map using the terms and conditions
        for (let clause of this._termsAndConditions) {
            for (let tradingTerm of clause.tradingTerms) {
                this.tradingTerms.set(tradingTerm.id, tradingTerm);
            }
        }
        // refresh the texts for the open sections, otherwise the panel gets empty
        for (let i = 0; i < this.showSection.length; i++) {
            if (this.showSection[i]) {
                setTimeout(() => {
                    this.setSectionText(i);
                });
            }
        }
    }

    get termsAndConditions(): Clause[] {
        return this._termsAndConditions;
    }

    // checks whether the terms are updated or not with respect to the original clause
    isSameWithTheOriginalClause(clause: Clause) {
        // if the comparison is disabled, we do not need to check the clause is changed or not
        if (!this.enableComparisonWithOtherTerms) {
            return true;
        }
        for (let tradingTerm of clause.tradingTerms) {
            if (!this.isSameWithTheOriginalTradingTerm(tradingTerm.id)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Compares the trading term which is shown in the UI and specified by the given identifier with the original term
     */
    isSameWithTheOriginalTradingTerm(tradingTermId: string) {
        // if the comparison is disabled, we do not need to check the clause is changed or not
        if (!this.enableComparisonWithOtherTerms) {
            return true;
        }

        let defaultTradingTerm = this.originalTradingTerms.get(tradingTermId);

        // if the given trading term is not included in the original clauses, return false
        if (!defaultTradingTerm) {
            return false;
        }

        if (defaultTradingTerm.value.valueQualifier == "STRING") {
            if (defaultTradingTerm.value.value[0].value != this.tradingTerms.get(tradingTermId).value.value[0].value) {
                return false;
            }
        } else if (defaultTradingTerm.value.valueQualifier == "NUMBER") {
            if (defaultTradingTerm.value.valueDecimal[0] != this.tradingTerms.get(tradingTermId).value.valueDecimal[0]) {
                return false;
            }
        } else if (defaultTradingTerm.value.valueQualifier == "QUANTITY") {
            if (defaultTradingTerm.value.valueQuantity[0].value != this.tradingTerms.get(tradingTermId).value.valueQuantity[0].value
                || defaultTradingTerm.value.valueQuantity[0].unitCode != this.tradingTerms.get(tradingTermId).value.valueQuantity[0].unitCode) {
                return false;
            }
        } else if (defaultTradingTerm.value.valueQualifier == "CODE") {
            if (defaultTradingTerm.value.valueCode[0].value != this.tradingTerms.get(tradingTermId).value.valueCode[0].value) {
                return false;
            }
        }
        return true;
    }

    private updateTermNegotiating(tradingTermId: string, value: string) {
        if (!this.tradingTerms || !this.tradingTerms.has(tradingTermId)) {
            return;
        }

        // update the value of parameter in tradingTerms map
        // handling of empty string
        if (value == "" && this.originalTradingTerms && this.originalTradingTerms.has(tradingTermId)) {
            let defaultTradingTerm = this.originalTradingTerms.get(tradingTermId);
            if (tradingTermId == "$incoterms_id") {
                value = defaultTradingTerm.value.valueCode[0].value
            }
        }
        this.tradingTerms.get(tradingTermId).value.valueCode[0].value = value;

        // update the value of parameter in tradingTerms map
        this.tradingTerms.get(tradingTermId).value.valueCode[0].value = value;

        // update the value of parameter in the text
        let elements = document.getElementsByClassName(this.generateClassForParameter(tradingTermId));
        if (elements && elements.length > 0) {
            let size = elements.length;
            for (let i = 0; i < size; i++) {
                let element: HTMLElement = <HTMLElement>elements[i];
                element.innerText = value;
                this.setElementColor(element, tradingTermId);
            }
        }
    }

    // if the trading term is updated, its color is set to red, otherwise to black.
    private setElementColor(element, tradingTermId: string) {
        if (this.isSameWithTheOriginalTradingTerm(tradingTermId)) {
            element.style.color = 'black';
        } else {
            element.style.color = 'red';
        }
    }

    public collapseClause(index:number){
        this.showSection[index] = !this.showSection[index];
        this.setSectionText(index);
    }

    public emitCollapseClause(index:number){
        this.negotiationClauseService.onClauseCollapsed.next(this.componentIndex + "-" +this._termsAndConditions[index].id)
    }

    private getClauseIdWithoutOrder(clauseId:string){
        let separatorIndex = clauseId.indexOf("_");
        return clauseId.substring(separatorIndex+1)
    }
}
