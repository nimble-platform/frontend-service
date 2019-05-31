import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { CallStatus } from "../../../common/call-status";
import { BPEService } from "../../bpe.service";
import {Clause} from '../../../catalogue/model/publish/clause';
import {UserService} from '../../../user-mgmt/user.service';
import {COUNTRY_NAMES} from '../../../common/utils';
import {UnitService} from '../../../common/unit-service';
import {deliveryPeriodUnitListId, warrantyPeriodUnitListId} from '../../../common/constants';
import {TradingTerm} from '../../../catalogue/model/publish/trading-term';


@Component({
    selector: "terms-and-conditions",
    templateUrl: "./terms-and-conditions.component.html",
    styleUrls: ["./terms-and-conditions.component.css"]
})
export class TermsAndConditionsComponent implements OnInit {

    // Inputs
    @Input() orderId:string = null;
    @Input() buyerPartyId:string;
    @Input() sellerPartyId:string;
    @Input() readOnly:boolean = false;
    @Input() rfqId:string = null;
    @Input() documentType:string; // "order", "rfq", "quotation";
    _originalTermAndConditionClauses:Clause[] = null; // original terms and conditions of the object
    _termsAndConditions:Clause[] = []; // updated terms and conditions of the object
    @Input() needATitle:boolean = true; // whether we need to add a title before displaying terms and conditions

    // Outputs
    @Output() onIncotermChanged = new EventEmitter();
    @Output() onTradingTermChanged = new EventEmitter();

    showPreview: boolean = false;
    callStatus : CallStatus = new CallStatus();

    showSection:boolean[] = [];

    // used to store values of parameters inside the terms and conditions text
    tradingTerms:Map<string,TradingTerm> = null;
    // used to store original values of parameters
    originalTradingTerms:Map<string,TradingTerm> = null;
    randomComponentId: string = '';

    // options
    INCOTERMS: string[] = [];
    PAYMENT_TERMS:string[] = [];
    COUNTRY_NAMES = COUNTRY_NAMES;
    UNITS:string[] = [];

    // selected values for Incoterm and Trading Term (e.g. Payment Terms)
    _selectedIncoterm: string = null;
    _selectedTradingTerm: string = null;

    constructor(public bpeService: BPEService,
                public userService: UserService,
                public unitService: UnitService) {

    }

    ngOnInit(): void {
        this.callStatus.submit();

        let array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        this.randomComponentId = "" + array[0];

        Promise.all([
            this.userService.getSettingsForParty(this.sellerPartyId),
            this.unitService.getCachedUnitList(deliveryPeriodUnitListId),
            this.unitService.getCachedUnitList(warrantyPeriodUnitListId)

        ]).then(([sellerPartySettings, deliveryPeriodUnits, warrantyPeriodUnits]) => {

            // populate available incoterms
            this.INCOTERMS = sellerPartySettings.negotiationSettings.incoterms;
            // populate available payment terms
            this.PAYMENT_TERMS = sellerPartySettings.negotiationSettings.paymentTerms;
            // populate available units
            this.UNITS = deliveryPeriodUnits.concat(warrantyPeriodUnits);



            // if there is no need to have a title, then display the preview
            if(!this.needATitle){
                this.showPreview = true;
            }

            this.callStatus.callback("Successfully fetched terms and conditions", true);
        }).catch(error => {
            this.callStatus.error("Error while fething terms and conditions",error);
        });
    }

    displayTermsAndConditions(){
        this.clearShowSectionArray();
        this.showPreview = !this.showPreview;
    }

    clearShowSectionArray(){
        for(let i = 0; i < 19; i++){
            this.showSection[i] = false;
        }
    }

    setSectionText(index:number){
        if(this.readOnly){
            let element = document.getElementById(this.generateIdForClause(index));

            let clause = this._termsAndConditions[index];

            let text = clause.content[0].value

            for(let tradingTerm of clause.tradingTerms){
                let id = tradingTerm.id;
                let spanText = "";
                if(this.isOriginalTradingTerm(tradingTerm.id)){
                    spanText = "<b><span id='"+this.generateIdForParameter(id)+"'>";

                }
                else{
                    spanText ="<b><span style='color: red' id='"+this.generateIdForParameter(id)+"'>";
                }
                if(tradingTerm.value.valueQualifier == "QUANTITY"){
                    let defaultValue = tradingTerm.value.valueQuantity[0].value;
                    let defaultUnit = tradingTerm.value.valueQuantity[0].unitCode;
                    text = text.replace(tradingTerm.id,spanText+defaultValue+" "+defaultUnit+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "STRING"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.id).value.value[0].value;
                    text = text.replace(tradingTerm.id,spanText+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.id).value.valueDecimal[0].toString();
                    text = text.replace(tradingTerm.id,spanText+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "CODE"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.id).value.valueCode[0].value;
                    text = text.replace(tradingTerm.id,spanText+defaultValue+"</span></b>");
                }
            }

            element.innerHTML = text;

        } else{
            let element = document.getElementById(this.generateIdForClause(index));
            let clause = this._termsAndConditions[index];
            let text = clause.content[0].value;

            // replace placeholders with spans
            for(let tradingTerm of clause.tradingTerms){
                let id = tradingTerm.id;
                let spanText = "";
                if(this.isOriginalTradingTerm(tradingTerm.id)){
                    spanText = "<b><span id='"+this.generateIdForParameter(id)+"'>";

                }
                else{
                    spanText = "<b><span style='color: red' id='"+this.generateIdForParameter(id)+"'>";
                }

                // for the quantities, we have value and unit
                if(tradingTerm.value.valueQualifier == "QUANTITY"){
                    let defaultValue = this.tradingTerms.get(id).value.valueQuantity[0].value;
                    let defaultUnit = this.tradingTerms.get(id).value.valueQuantity[0].unitCode;
                    text = text.replace(id,spanText+defaultValue+" "+defaultUnit+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "STRING"){
                    let defaultValue = this.tradingTerms.get(id).value.value[0].value;
                    text = text.replace(id,spanText+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                    let defaultValue = this.tradingTerms.get(id).value.valueDecimal[0].toString();
                    text = text.replace(id,spanText+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "CODE"){
                    let defaultValue = this.tradingTerms.get(id).value.valueCode[0].value;
                    text = text.replace(id,spanText+defaultValue+"</span></b>");
                }
            }

            element.innerHTML = text;
        }
    }

    updateParameter(sectionIndex:number,id:string,value:string,isUnit:boolean = false){
        let clause = this.originalTermAndConditionClauses[sectionIndex];
        // handling of empty string
        if(value == ""){

            for(let tradingTerm of clause.tradingTerms){
                if(tradingTerm.id == id){
                    if(tradingTerm.value.valueQualifier == "STRING"){
                        value = tradingTerm.value.value[0].value;
                    } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                        value = tradingTerm.value.valueDecimal[0].toString();
                    } else if(tradingTerm.value.valueQualifier == "QUANTITY"){
                        value = tradingTerm.value.valueQuantity[0].value.toString();
                    } else if(tradingTerm.value.valueQualifier == "CODE"){
                        value = tradingTerm.value.valueCode[0].value ;
                    }
                    break;
                }
            }
        }
        // update the value of parameter
        if(isUnit){
            this.tradingTerms.get(id).value.valueQuantity[0].unitCode = value;

            let element = document.getElementById(this.generateIdForParameter(id));
            element.innerText = this.tradingTerms.get(id).value.valueQuantity[0].value +" "+ value;

            this.setElementColor(element,id);
        } else{
            let tradingTerm = this.tradingTerms.get(id);
            if(tradingTerm.value.valueQualifier == "STRING"){
                tradingTerm.value.value[0].value = value;
            } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                tradingTerm.value.valueDecimal[0] = Number(value);
            } else if(tradingTerm.value.valueQualifier == "QUANTITY"){
                tradingTerm.value.valueQuantity[0].value = Number(value);
            } else if(tradingTerm.value.valueQualifier == "CODE"){
                tradingTerm.value.valueCode[0].value = value;
            }

            let element = document.getElementById(this.generateIdForParameter(id));

            if(tradingTerm.value.valueQualifier == "QUANTITY"){
                element.innerText = value + " " + tradingTerm.value.valueQuantity[0].unitCode;
            } else{
                element.innerText = value;
            }

            this.setElementColor(element,id);
        }

        // emit the new value if necessary
        if(id == "$incoterms_id"){
            this.onIncotermChanged.emit(value);
        }
        else if(id == "$payment_id"){
            this.onTradingTermChanged.emit(value);
        }
    }

    generateIdForClause(clauseId:number){
        return this.randomComponentId + "-" + this.documentType + "-" + clauseId;
    }

    generateIdForParameter(parameter:string){
        return this.documentType + "-" + parameter;
    }

    get selectedIncoterm():string{
        return this._selectedIncoterm;
    }

    @Input('selectedIncoterm')
    set selectedIncoterm(incoterm:string){
        this._selectedIncoterm = incoterm;

        let id = "$incoterms_id";
        this.updateTermNegotiating(id, this._selectedIncoterm);
    }

    get selectedTradingTerm():string{
        return this._selectedTradingTerm;
    }

    @Input('selectedTradingTerm')
    set selectedTradingTerm(tradingTerm:string){
        this._selectedTradingTerm = tradingTerm;
        this.updateTermNegotiating("$payment_id", tradingTerm);
    }

    @Input()
    set originalTermAndConditionClauses(clauses: Clause[]) {
        this._originalTermAndConditionClauses = clauses;

        this.originalTradingTerms = new Map<string, TradingTerm>();
        // create tradingTerms map using the original terms and conditions
        for(let clause of this._originalTermAndConditionClauses){
            for(let tradingTerm of clause.tradingTerms){
                this.originalTradingTerms.set(tradingTerm.id,tradingTerm);
            }
        }

        // refresh the texts for the open sections, otherwise the panel gets empty
        for(let i=0; i<this.showSection.length; i++) {
            if(this.showSection[i]) {
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

        // create valuesOfParameters map
        this.tradingTerms = new Map<string, TradingTerm>();
        // create tradingTerms map using the terms and conditions
        for(let clause of this._termsAndConditions){
            for(let tradingTerm of clause.tradingTerms){
                this.tradingTerms.set(tradingTerm.id,tradingTerm);
            }
        }
        // refresh the texts for the open sections, otherwise the panel gets empty
        for(let i=0; i<this.showSection.length; i++) {
            if(this.showSection[i]) {
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
    isClauseUpdated(clause:Clause){
        // if we have an order, we do not need to check the clause is changed or not
        if(this.orderId){
            return true;
        }
        for(let tradingTerm of clause.tradingTerms){

            if (!this.isOriginalTradingTerm(tradingTerm.id)){
                return false;
            }

        }
        return true;
    }

    isOriginalTradingTerm(tradingTermId:string){
        // if we have an order, we do not need to check the clause is changed or not
        if(this.orderId){
            return true;
        }

        let defaultTradingTerm = this.originalTradingTerms.get(tradingTermId);

        // if the given trading term is not included in the original clauses, return false
        if(!defaultTradingTerm){
            return false;
        }

        if(defaultTradingTerm.value.valueQualifier == "STRING"){
            if(defaultTradingTerm.value.value[0].value != this.tradingTerms.get(tradingTermId).value.value[0].value){
                return false;
            }
        } else if(defaultTradingTerm.value.valueQualifier == "NUMBER"){
            if(defaultTradingTerm.value.valueDecimal[0] != this.tradingTerms.get(tradingTermId).value.valueDecimal[0]){
                return false;
            }
        } else if(defaultTradingTerm.value.valueQualifier == "QUANTITY"){
            if(defaultTradingTerm.value.valueQuantity[0].value != this.tradingTerms.get(tradingTermId).value.valueQuantity[0].value
                || defaultTradingTerm.value.valueQuantity[0].unitCode != this.tradingTerms.get(tradingTermId).value.valueQuantity[0].unitCode){
                return false;
            }
        } else if(defaultTradingTerm.value.valueQualifier == "CODE"){
            if(defaultTradingTerm.value.valueCode[0].value != this.tradingTerms.get(tradingTermId).value.valueCode[0].value){
                return false;
            }
        }
        return true;
    }

    private updateTermNegotiating(tradingTermId:string,value:string){
        // update the value of parameter in tradingTerms map
        if(this.tradingTerms){
            this.tradingTerms.get(tradingTermId).value.valueCode[0].value = value;
        }
        // update the value of parameter in the text
        let element = document.getElementById(this.generateIdForParameter(tradingTermId));
        if(element){
            element.innerText = value;
            this.setElementColor(element,tradingTermId);
        }
    }

    // if the trading term is updated, its color is set to red, otherwise to black.
    private setElementColor(element, tradingTermId:string){
        if(this.isOriginalTradingTerm(tradingTermId)){
            element.style.color = 'black';
        } else{
            element.style.color = 'red';
        }
    }
}
