import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {createText} from '../../common/utils';
import {TradingTerm} from '../../catalogue/model/publish/trading-term';
import {Quantity} from '../../catalogue/model/publish/quantity';
import {MultiTypeValue} from '../../catalogue/model/publish/multi-type-value';
import {Option} from '../../common/options-input.component';
import {Clause} from '../../catalogue/model/publish/clause';

@Component({
    selector: "edit-trading-term-modal",
    templateUrl: "./edit-trading-term-modal.component.html",
    styleUrls: ["./edit-trading-term-modal.component.css"]
})
export class EditTradingTermModalComponent implements OnInit {

    @ViewChild("modal") modal: ElementRef;

    // new trading term
    tradingTerm:TradingTerm = null;

    // available data types for trading term
    DATA_TYPES :Option[] = [
        { name: "Text", value: "STRING" },
        { name: "Number", value: "NUMBER" },
        { name: "Quantity", value: "QUANTITY" },
    ];

    constructor(private modalService: NgbModal) {
    }

    ngOnInit() {

    }

    open(tradingTerms:TradingTerm[],clause:Clause, element:any) {
        this.tradingTerm = new TradingTerm();
        this.addValuesToTradingTerm();

        this.modalService.open(this.modal).result.then(() => {

            // check the id
            // the id of trading term should begin with '$'
            if(this.tradingTerm.id.charAt(0) != '$'){
                this.tradingTerm.id = "$" + this.tradingTerm.id;
            }

            // push the created trading term to the list
            tradingTerms.push(this.tradingTerm);
            // add the id of trading term to the end of clause content
            clause.content[0].value += this.tradingTerm.id + " ";
            // update the innerHTML
            element.innerHTML = element.innerHTML.concat("<span id='"+clause.id+"-"+this.tradingTerm.id+"'><b>" + this.tradingTerm.id + "</b></span>"," ");
            // the span should be non-editable
            element = document.getElementById(clause.id+"-"+this.tradingTerm.id);
            element.contentEditable = "false";

        }, () => {

        });
    }

    addValuesToTradingTerm() {
        // initialize the id of trading term
        this.tradingTerm.id = '';
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
    }


    // used to update the value of trading term if its value qualifier is NUMBER
    setValueDecimal(i: number, value: number) {
        this.tradingTerm.value.valueDecimal[i] = Number(value);
    }
}
