/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { copy, COUNTRY_NAMES, createText } from '../../common/utils';
import { TradingTerm } from '../../catalogue/model/publish/trading-term';
import { Quantity } from '../../catalogue/model/publish/quantity';
import { MultiTypeValue } from '../../catalogue/model/publish/multi-type-value';
import { Option } from '../../common/options-input.component';
import { Clause } from '../../catalogue/model/publish/clause';
import { CompanySettings } from '../model/company-settings';
import { Code } from '../../catalogue/model/publish/code';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: "edit-trading-term-modal",
    templateUrl: "./edit-trading-term-modal.component.html",
    styleUrls: ["./edit-trading-term-modal.component.css"]
})
export class EditTradingTermModalComponent implements OnInit {

    @ViewChild("modal") modal: ElementRef;

    // company settings
    @Input() settings: CompanySettings = null;

    // new trading term
    tradingTerm: TradingTerm = null;
    // ids of the existing trading terms
    existingTradingTermIds: string[] = [];

    // options
    INCOTERMS: string[] = [];
    PAYMENT_TERMS: string[] = [];
    COUNTRY_NAMES = COUNTRY_NAMES;

    // available data types for trading term
    DATA_TYPES: Option[] = [
        { name: "Text", value: "STRING" },
        { name: "Number", value: "NUMBER" },
        { name: "Quantity", value: "QUANTITY" },
    ];

    constructor(private modalService: NgbModal, private translate: TranslateService) {
    }

    ngOnInit() {

        // populate available incoterms
        this.INCOTERMS = this.settings.negotiationSettings.incoterms;
        // populate available payment terms
        this.PAYMENT_TERMS = this.settings.negotiationSettings.paymentTerms;

    }

    open(tradingTerms: TradingTerm[], clause: Clause, element: any, _existingTradingTermIds: string[], tradingTerm: TradingTerm = null) {
        // set existing trading term ids
        this.existingTradingTermIds = _existingTradingTermIds;
        // Edit the given trading term
        if (tradingTerm) {
            // set the trading term
            this.tradingTerm = copy(tradingTerm);
        }
        // Create a new trading term
        else {
            this.tradingTerm = new TradingTerm();
        }
        this.addValuesToTradingTerm();

        this.modalService.open(this.modal).result.then(() => {

            // check the id
            // the id of trading term should begin with '$'
            if (this.tradingTerm.id.charAt(0) != '$') {
                this.tradingTerm.id = "$" + this.tradingTerm.id;
            }
            // no trading term means that we create a new one
            if (!tradingTerm) {
                // push the created trading term to the list
                tradingTerms.push(this.tradingTerm);
                // add the id of trading term to the end of clause content
                clause.content[0].value += this.tradingTerm.id + " ";
                // update the innerHTML
                element.innerHTML = element.innerHTML.concat("<span id='" + clause.id + "-" + this.tradingTerm.id + "'><b>" + this.tradingTerm.id + " </b></span>");
                // the span should be non-editable
                element = document.getElementById(clause.id + "-" + this.tradingTerm.id);
                element.contentEditable = "false";
            }
            // update the trading term
            else {
                // update the clause content
                clause.content[0].value = clause.content[0].value.replace(tradingTerm.id, this.tradingTerm.id);
                // update the innerHTML
                // we use regular expression to update the id of span as well.
                element.innerHTML = element.innerHTML.replace(new RegExp(tradingTerm.id.substr(1), 'g'), this.tradingTerm.id.substr(1));
            }

            // update the trading term
            if (tradingTerm) {
                tradingTerm.id = this.tradingTerm.id;
                tradingTerm.tradingTermFormat = this.tradingTerm.tradingTermFormat;
                tradingTerm.value.value = this.tradingTerm.value.value;
                tradingTerm.value.valueQualifier = this.tradingTerm.value.valueQualifier;
                tradingTerm.value.valueQuantity = this.tradingTerm.value.valueQuantity;
                tradingTerm.value.valueCode = this.tradingTerm.value.valueCode;
                tradingTerm.value.valueDecimal = this.tradingTerm.value.valueDecimal;
                tradingTerm.value.name = this.tradingTerm.value.name;
            }

        }, () => {

        });
    }

    addValuesToTradingTerm() {
        // initialize the id of trading term
        if (!this.tradingTerm.id) {
            this.tradingTerm.id = '';
        }
        // initialize the value of trading term
        if (!this.tradingTerm.value) {
            this.tradingTerm.value = new MultiTypeValue();
        }
        if (this.tradingTerm.value.value.length === 0) {
            this.tradingTerm.value.value.push(createText(''));
        }
        if (this.tradingTerm.value.valueDecimal.length === 0) {
            this.tradingTerm.value.valueDecimal.push(0);
        }
        if (this.tradingTerm.value.valueQuantity.length === 0) {
            this.tradingTerm.value.valueQuantity.push(new Quantity());
        }
        if (this.tradingTerm.value.valueCode.length == 0) {
            this.tradingTerm.value.valueCode.push(new Code());
        }
    }


    // used to update the value of trading term if its value qualifier is NUMBER
    setValueDecimal(i: number, value: number) {
        this.tradingTerm.value.valueDecimal[i] = Number(value);
    }

    onIdUpdate() {
        if (this.tradingTerm.id.toUpperCase().indexOf("INCOTERM") != -1) {
            this.tradingTerm.value.valueQualifier = "CODE";
            this.tradingTerm.value.valueCode[0].listID = "INCOTERMS_LIST";
        }
        else if (this.tradingTerm.id.toUpperCase().indexOf("PAYMENT") != -1) {
            this.tradingTerm.value.valueQualifier = "CODE";
            this.tradingTerm.value.valueCode[0].listID = "PAYMENT_MEANS_LIST";
        }
        else if (this.tradingTerm.id.toUpperCase().indexOf("COUNTRY") != -1) {
            this.tradingTerm.value.valueQualifier = "CODE";
            this.tradingTerm.value.valueCode[0].listID = "COUNTRY_LIST";
        }
        // valueQualifier is CODE, but the id does not contain INCOTERM, PAYMENT or COUNTRY strings
        else if (this.tradingTerm.value.valueQualifier == "CODE") {
            this.tradingTerm.value.valueQualifier = "STRING";
        }
    }

    idExists(): boolean {
        let id = this.tradingTerm.id.charAt(0) == '$' ? this.tradingTerm.id : "$" + this.tradingTerm.id;
        return this.existingTradingTermIds.indexOf(id) != -1;
    }

}
