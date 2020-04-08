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

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { AppComponent } from "../../app.component";
import { CompanySettings } from '../model/company-settings';
import { TradingTerm } from '../../catalogue/model/publish/trading-term';
import { deliveryPeriodUnitListId, warrantyPeriodUnitListId } from '../../common/constants';
import { Clause } from '../../catalogue/model/publish/clause';
import { CallStatus } from '../../common/call-status';
import { copy, COUNTRY_NAMES } from '../../common/utils';
import { UnitService } from '../../common/unit-service';
import { BPEService } from '../../bpe/bpe.service';
import { EditTradingTermModalComponent } from './edit-trading-term-modal.component';
import { Text } from '../../catalogue/model/publish/text';
import { TradingPreferences } from '../../catalogue/model/publish/trading-preferences';
import { UserService } from '../user.service';
import { TranslateService } from '@ngx-translate/core';
import { FEDERATIONID } from '../../catalogue/model/constants';

@Component({
    selector: "company-terms-and-conditions",
    templateUrl: "./company-terms-and-conditions.html",
    styleUrls: ["./company-terms-and-conditions.css"]
})
export class CompanyTermsAndConditions implements OnInit {

    @Input() settings: CompanySettings = null;

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
    COUNTRY_NAMES = COUNTRY_NAMES;
    UNITS: string[] = [];

    @ViewChild(EditTradingTermModalComponent)
    private editTradingTermModelComponent: EditTradingTermModalComponent;

    constructor(public route: ActivatedRoute,
        public userService: UserService,
        public appComponent: AppComponent,
        public unitService: UnitService,
        private translate: TranslateService,
        public bpeService: BPEService) {

    }

    ngOnInit(): void {
        this.initPageStatus.submit();

        Promise.all([
            this.unitService.getCachedUnitList(deliveryPeriodUnitListId),
            this.unitService.getCachedUnitList(warrantyPeriodUnitListId),
            this.bpeService.getTermsAndConditions(null, FEDERATIONID(), this.settings.companyID, null, null, this.settings.negotiationSettings.company.federationInstanceID),
        ]).then(([deliveryPeriodUnits, warrantyPeriodUnits, defaultTermsAndConditions]) => {

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
                this.removeOrderNumberFromClauseId(this.defaultTermsAndConditions);
            }

            // create sales terms if the company does not have any
            if (!this.settings.negotiationSettings.company.salesTerms) {
                this.settings.negotiationSettings.company.salesTerms = new TradingPreferences();
            }

            // copy the terms and conditions
            this.termsAndConditions = copy(this.settings.negotiationSettings.company.salesTerms.termOrCondition);
            // sort terms and conditions
            this.termsAndConditions.sort((clause1, clause2) => {
                let order1 = Number(clause1.id.substring(0, clause1.id.indexOf("_")));
                let order2 = Number(clause2.id.substring(0, clause2.id.indexOf("_")));
                return order1 - order2;
            });
            // update the clause ids
            this.removeOrderNumberFromClauseId(this.termsAndConditions);

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

    // called when the user updated the id of clause
    onClauseIdUpdated(oldId: string, index: number, newId: string) {
        // update the showSection map
        this.showSection.delete(oldId);
        this.showSection.set(newId, true);
        // update the clause id
        this.termsAndConditions[index].id = newId;
    }

    // used to update clause content on UI
    setSectionText(clause: Clause) {
        // get the clause content
        let text = clause.content[0].value;
        // get the element representing the clause content
        let element = document.getElementById(clause.id);
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
    }

    // this method is called when the user changes the content of clause
    onContentUpdated(clause: Clause, event: any) {
        // check whether the parameters are deleted or not
        for (let tradingTerm of clause.tradingTerms) {
            if (event.target.innerText.indexOf(tradingTerm.id) == -1) {
                // since there is a missing trading term, we need to set section text again
                this.setSectionText(clause);
                return;
            }
        }
        clause.content[0].value = event.target.innerText;
    }

    // methods used to add/edit/remove trading terms
    onAddTradingTerm(clause: Clause) {
        let element = document.getElementById(clause.id);
        this.editTradingTermModelComponent.open(clause.tradingTerms, clause, element, this.getExistingTradingTermIds());
    }

    onEditTradingTerm(clause: Clause, tradingTerm: TradingTerm) {
        let element = document.getElementById(clause.id);
        this.editTradingTermModelComponent.open(clause.tradingTerms, clause, element, this.getExistingTradingTermIds(), tradingTerm);
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
        // generate an id for the clause
        let id = "Title of clause";
        let idExists = this.showSection.has(id);
        let number = 1;
        while (idExists) {
            id += number;
            idExists = this.showSection.has(id);
        }
        // set the id of clause
        clause.id = id;
        // set the content of clause
        clause.content[0] = new Text('');
        // add clause
        this.termsAndConditions.push(clause);
        // update the showSection map
        this.showSection.set(clause.id, false);
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
        if (!this.checkUniquenessOfClauses(termsAndConditions)) {
            this.callStatus.error("Each clause should have unique title.");
            return;
        }
        this.addOrderNumberForClauses(termsAndConditions);
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

    // each clause should have unique id
    // this method checks the uniqueness of clauses and returns true if each clause has unique id
    checkUniquenessOfClauses(clauses: Clause[]): boolean {
        // clause id list
        let clauseIds = [];
        for (let clause of clauses) {
            if (clauseIds.indexOf(clause.id) != -1) {
                return false;
            }
            clauseIds.push(clause.id);
        }
        return true;
    }

    // update the clause id by removing the number at the beginning of id
    // this number represents the order.
    removeOrderNumberFromClauseId(clauses: Clause[]) {
        for (let clause of clauses) {
            let startIndex = clause.id.indexOf("_");
            clause.id = clause.id.substring(startIndex + 1);
        }
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
}
