import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {COUNTRY_NAMES, createText} from '../../common/utils';
import {TradingTerm} from '../../catalogue/model/publish/trading-term';
import {Quantity} from '../../catalogue/model/publish/quantity';
import {MultiTypeValue} from '../../catalogue/model/publish/multi-type-value';
import {Option} from '../../common/options-input.component';
import {Clause} from '../../catalogue/model/publish/clause';
import {CompanySettings} from '../model/company-settings';
import {Code} from '../../catalogue/model/publish/code';

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
    tradingTerm:TradingTerm = null;

    // options
    INCOTERMS: string[] = [];
    PAYMENT_TERMS:string[] = [];
    COUNTRY_NAMES = COUNTRY_NAMES;

    // available data types for trading term
    DATA_TYPES :Option[] = [
        { name: "Text", value: "STRING" },
        { name: "Number", value: "NUMBER" },
        { name: "Quantity", value: "QUANTITY" },
    ];

    constructor(private modalService: NgbModal) {
    }

    ngOnInit() {

        // populate available incoterms
        this.INCOTERMS = this.settings.negotiationSettings.incoterms;
        // populate available payment terms
        this.PAYMENT_TERMS = this.settings.negotiationSettings.paymentTerms;

    }

    open(tradingTerms:TradingTerm[],clause:Clause, element:any, tradingTerm:TradingTerm = null) {
        // store the previous id of trading term since we need it if we update a trading term
        let previousId = null;
        // Edit the given trading term
        if(tradingTerm){
            // set the previous id
            previousId = tradingTerm.id;
            // set the trading term
            this.tradingTerm = tradingTerm;
        }
        // Create a new trading term
        else{
            this.tradingTerm = new TradingTerm();
        }
        this.addValuesToTradingTerm();

        this.modalService.open(this.modal).result.then(() => {

            // check the id
            // the id of trading term should begin with '$'
            if(this.tradingTerm.id.charAt(0) != '$'){
                this.tradingTerm.id = "$" + this.tradingTerm.id;
            }
            // no previous id means that we create a new one
            if(!previousId){
                // push the created trading term to the list
                tradingTerms.push(this.tradingTerm);
                // add the id of trading term to the end of clause content
                clause.content[0].value += this.tradingTerm.id + " ";
                // update the innerHTML
                element.innerHTML = element.innerHTML.concat("<span id='"+clause.id+"-"+this.tradingTerm.id+"'><b>" + this.tradingTerm.id + "</b></span>"," ");
                // the span should be non-editable
                element = document.getElementById(clause.id+"-"+this.tradingTerm.id);
                element.contentEditable = "false";
            }
            // update the trading term
            else{
                // update the clause content
                clause.content[0].value = clause.content[0].value.replace(previousId, this.tradingTerm.id);
                // update the innerHTML
                // we use regular expression to update the id of span as well.
                element.innerHTML = element.innerHTML.replace(new RegExp(previousId.substr(1),'g'),this.tradingTerm.id.substr(1));
            }

        }, () => {

        });
    }

    addValuesToTradingTerm() {
        // initialize the id of trading term
        if(!this.tradingTerm.id){
            this.tradingTerm.id = '';
        }
        // initialize the value of trading term
        if(!this.tradingTerm.value){
            this.tradingTerm.value = new MultiTypeValue();
        }
        if(this.tradingTerm.value.value.length === 0){
            this.tradingTerm.value.value.push(createText(''));
        }
        if(this.tradingTerm.value.valueDecimal.length === 0) {
            this.tradingTerm.value.valueDecimal.push(0);
        }
        if(this.tradingTerm.value.valueQuantity.length === 0) {
            this.tradingTerm.value.valueQuantity.push(new Quantity());
        }
        if(this.tradingTerm.value.valueCode.length == 0){
            this.tradingTerm.value.valueCode.push(new Code());
        }
    }


    // used to update the value of trading term if its value qualifier is NUMBER
    setValueDecimal(i: number, value: number) {
        this.tradingTerm.value.valueDecimal[i] = Number(value);
    }

    onIdUpdate(){
        if(this.tradingTerm.id.toUpperCase().indexOf("INCOTERM") != -1){
            this.tradingTerm.value.valueQualifier = "CODE";
            this.tradingTerm.value.valueCode[0].listID = "INCOTERMS_LIST";
        }
        else if(this.tradingTerm.id.toUpperCase().indexOf("PAYMENT") != -1){
            this.tradingTerm.value.valueQualifier = "CODE";
            this.tradingTerm.value.valueCode[0].listID = "PAYMENT_MEANS_LIST";
        }
        else if(this.tradingTerm.id.toUpperCase().indexOf("COUNTRY") != -1){
            this.tradingTerm.value.valueQualifier = "CODE";
            this.tradingTerm.value.valueCode[0].listID = "COUNTRY_LIST";
        }
        // valueQualifier is CODE, but the id does not contain INCOTERM, PAYMENT or COUNTRY strings
        else if(this.tradingTerm.value.valueQualifier == "CODE"){
            this.tradingTerm.value.valueQualifier = "STRING";
        }
    }

}
