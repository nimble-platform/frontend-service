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
    @Input() termsAndConditions:Clause[];

    // Outputs
    @Output() onIncotermChanged = new EventEmitter();
    @Output() onTradingTermChanged = new EventEmitter();

    showPreview: boolean = false;
    callStatus : CallStatus = new CallStatus();
    // these are the default clauses which are retrieved from the server
    defaultTermAndConditionClauses:Clause[];

    showSection:boolean[] = [];

    // used to store values of parameters inside the terms and conditions text
    tradingTerms:Map<string,TradingTerm> = null;

    // options
    INCOTERMS: string[] = [];
    PAYMENT_TERMS:string[] = [];
    COUNTRY_NAMES = COUNTRY_NAMES;
    UNITS:string[] = [];

    // selected values for Incoterm and Trading Term (e.g. Payment Terms)
    _selectedIncoterm: string = null;
    _selectedTradingTerm: string = null;
    _isIncotermsNegotiating:boolean = true;
    _isTradingTermsNegotiating: boolean = true;

    constructor(public bpeService: BPEService,
                public userService: UserService,
                public unitService: UnitService) {

    }

    ngOnInit(): void {
        this.callStatus.submit();

        Promise.all([
            this.userService.getSettingsForParty(this.sellerPartyId),
            this.unitService.getCachedUnitList(deliveryPeriodUnitListId),
            this.unitService.getCachedUnitList(warrantyPeriodUnitListId),
            this.bpeService.getTermsAndConditions(this.orderId,this.buyerPartyId, this.sellerPartyId, this.rfqId, this.selectedIncoterm, this.selectedTradingTerm),
        ]).then(([sellerPartySettings, deliveryPeriodUnits, warrantyPeriodUnits,termsAndConditions]) => {

            // populate available incoterms
            this.INCOTERMS = sellerPartySettings.negotiationSettings.incoterms;
            // populate available payment terms
            this.PAYMENT_TERMS = sellerPartySettings.negotiationSettings.paymentTerms;
            // populate available units
            this.UNITS = deliveryPeriodUnits.concat(warrantyPeriodUnits);

            // set default term and condition clauses
            this.defaultTermAndConditionClauses = termsAndConditions;
            // sort terms and conditions to get the correct order
            this.defaultTermAndConditionClauses.sort((clause1, clause2) => {
               let order1 = Number(clause1.id.substring(0,clause1.id.indexOf("_")));
               let order2 = Number(clause2.id.substring(0,clause2.id.indexOf("_")));
               return order1 - order2;
            });

            // create terms and conditions if we do not have any
            if(this.termsAndConditions.length == 0){
                for(let clause of this.defaultTermAndConditionClauses){
                    let newClause:Clause = JSON.parse(JSON.stringify(clause));
                    this.termsAndConditions.push(newClause);
                }
            }

            // create valuesOfParameters map
            if(!this.tradingTerms){
                this.tradingTerms = new Map<string, TradingTerm>();
                // create tradingTerms map using the terms and conditions
                for(let clause of this.termsAndConditions){
                    for(let tradingTerm of clause.tradingTerms){
                        this.tradingTerms.set(tradingTerm.id,tradingTerm);
                    }
                }
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
            let clause = this.defaultTermAndConditionClauses[index];

            let element = document.getElementById(this.generateIdForClause(index));

            clause = this.getClause(clause.id);

            let text = clause.content[0].value

            for(let tradingTerm of clause.tradingTerms){
                if(tradingTerm.value.valueQualifier == "QUANTITY"){
                    let defaultValue = tradingTerm.value.valueQuantity[0].value;
                    let defaultUnit = tradingTerm.value.valueQuantity[0].unitCode;
                    text = text.replace(tradingTerm.id,"<b><span>"+defaultValue+" "+defaultUnit+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "STRING"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.id).value.value[0].value;
                    text = text.replace(tradingTerm.id,"<b><span>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.id).value.valueDecimal[0].toString();
                    text = text.replace(tradingTerm.id,"<b><span>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "CODE"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.id).value.valueCode[0].value;
                    text = text.replace(tradingTerm.id,"<b><span>"+defaultValue+"</span></b>");
                }
            }

            element.innerHTML = text;

        } else{
            let element = document.getElementById(this.generateIdForClause(index));
            let clause = this.defaultTermAndConditionClauses[index];
            let text = clause.content[0].value;

            // replace placeholders with spans
            for(let tradingTerm of clause.tradingTerms){
                let id = tradingTerm.id;
                // for the quantities, we have value and unit
                if(tradingTerm.value.valueQualifier == "QUANTITY"){
                    let defaultValue = this.tradingTerms.get(id).value.valueQuantity[0].value;
                    let defaultUnit = this.tradingTerms.get(id).value.valueQuantity[0].unitCode;
                    text = text.replace(id,"<b><span id='"+this.generateIdForParameter(id)+"'>"+defaultValue+" "+defaultUnit+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "STRING"){
                    let defaultValue = this.tradingTerms.get(id).value.value[0].value;
                    text = text.replace(id,"<b><span id='"+this.generateIdForParameter(id)+"'>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                    let defaultValue = this.tradingTerms.get(id).value.valueDecimal[0].toString();
                    text = text.replace(id,"<b><span id='"+this.generateIdForParameter(id)+"'>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "CODE"){
                    let defaultValue = this.tradingTerms.get(id).value.valueCode[0].value;
                    text = text.replace(id,"<b><span id='"+this.generateIdForParameter(id)+"'>"+defaultValue+"</span></b>");
                }
            }

            element.innerHTML = text;
        }
    }

    updateParameter(sectionIndex:number,id:string,value:string,isUnit:boolean = false){
        // handling of empty string
        if(value == ""){
            let clause = this.defaultTermAndConditionClauses[sectionIndex];

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
        }

        // emit the new value if necessary
        if(id == "$incoterms_id" && this.isIncotermsNegotiating){
            this.onIncotermChanged.emit(value);
        }
        else if(id == "$payment_id" && this.isTradingTermsNegotiating){
            this.onTradingTermChanged.emit(value);
        }
    }

    private getClause(clauseId:string){
        for(let clause of this.termsAndConditions){
            if(clause.id == clauseId){
                return clause;
            }
        }
    }

    getClauseName(clause:Clause){
        let startIndex = clause.id.indexOf("_");

        return clause.id.substring(startIndex+1);
    }

    generateIdForClause(clauseId:number){
        return this.documentType + "-" + clauseId;
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

        if(this._selectedIncoterm != ""){
            this.updateTermNegotiating(id, this._selectedIncoterm);
        }
    }

    get isIncotermsNegotiating():boolean{
        return this._isIncotermsNegotiating;
    }

    @Input('isIncotermsNegotiating')
    set isIncotermsNegotiating(isNegotiating:boolean){
        this._isIncotermsNegotiating = isNegotiating;

        let id = "$incoterms_id";
        // if we do not negotiate incoterms, use the default value
        if(!isNegotiating && this.defaultTermAndConditionClauses){

            for(let clause of this.defaultTermAndConditionClauses){
                for(let tradingTerm of clause.tradingTerms){
                    if(tradingTerm.id == id){

                        this.updateTermNegotiating(id,tradingTerm.value.valueCode[0].value);

                        break;
                    }
                }
            }
        }
        // otherwise, use the selected incoterm
        else if(this._selectedIncoterm)
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

    get isTradingTermsNegotiating():boolean{
        return this._isTradingTermsNegotiating;
    }

    @Input('isTradingTermsNegotiating')
    set isTradingTermsNegotiating(isNegotiating:boolean){
        this._isTradingTermsNegotiating = isNegotiating;

        let id = "$payment_id";
        // if we do not negotiate trading terms, then use the default value
        if(!isNegotiating && this.defaultTermAndConditionClauses){
            for(let clause of this.defaultTermAndConditionClauses){
                for(let tradingTerm of clause.tradingTerms){
                    if(tradingTerm.id == id){
                        this.updateTermNegotiating(id, tradingTerm.value.valueCode[0].value);
                        break;
                    }
                }
            }
        }
        // otherwise, use the selected trading terms
        else if(this._selectedTradingTerm){
            // construct to value representing the selected trading term
            this.updateTermNegotiating(id, this._selectedTradingTerm);

        }
    }

    private updateTermNegotiating(id:string,value:string){
        // update the value of parameter in tradingTerms map
        if(this.tradingTerms){
            this.tradingTerms.get(id).value.valueCode[0].value = value;
        }
        // update the value of parameter in the text
        let element = document.getElementById(this.generateIdForParameter(id));
        if(element){
            element.innerText = value;
        }
    }
}
