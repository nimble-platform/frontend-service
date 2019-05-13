import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { CallStatus } from "../../../common/call-status";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
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

    // selected values for Incoterm and Trading Terms (e.g. Payment Terms)
    _selectedIncoterm: string = null;
    _selectedTradingTerms: TradingTerm[] = [];
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
            this.bpeService.getTermsAndConditions(this.orderId,this.buyerPartyId, this.sellerPartyId, this.rfqId, this.selectedIncoterm, this.selectedTradingTerms),
        ]).then(([sellerPartySettings, deliveryPeriodUnits, warrantyPeriodUnits,termsAndConditions]) => {

            // populate available incoterms
            this.INCOTERMS = sellerPartySettings.negotiationSettings.incoterms;
            // populate available payment terms
            this.PAYMENT_TERMS = sellerPartySettings.negotiationSettings.paymentTerms;
            // populate available units
            this.UNITS = deliveryPeriodUnits.concat(warrantyPeriodUnits);

            // set default term and condition clauses
            this.defaultTermAndConditionClauses = termsAndConditions;

            // create terms and conditions if we do not have any
            if(this.termsAndConditions.length == 0){
                for(let clause of this.defaultTermAndConditionClauses){
                    let newClause:Clause = JSON.parse(JSON.stringify(clause));
                    newClause.id = UBLModelUtils.generateUUID();
                    this.termsAndConditions.push(newClause);
                }
            }

            // create valuesOfParameters map
            if(!this.tradingTerms){
                this.tradingTerms = new Map<string, TradingTerm>();
                // create tradingTerms map using the terms and conditions
                for(let clause of this.termsAndConditions){
                    for(let tradingTerm of clause.tradingTerms){
                        this.tradingTerms.set(tradingTerm.tradingTermFormat,tradingTerm);
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

            clause = this.getClause(this.getClauseName(clause));

            let text = clause.content[0].value

            for(let tradingTerm of clause.tradingTerms){
                if(tradingTerm.value.valueQualifier == "QUANTITY"){
                    let defaultValue = tradingTerm.value.valueQuantity[0].value;
                    let defaultUnit = tradingTerm.value.valueQuantity[0].unitCode;
                    text = text.replace(tradingTerm.tradingTermFormat,"<b><span>"+defaultValue+" "+defaultUnit+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "STRING"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.tradingTermFormat).value.value[0].value;
                    text = text.replace(tradingTerm.tradingTermFormat,"<b><span>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.tradingTermFormat).value.valueDecimal[0].toString();
                    text = text.replace(tradingTerm.tradingTermFormat,"<b><span>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "CODE"){
                    let defaultValue = this.tradingTerms.get(tradingTerm.tradingTermFormat).value.valueCode[0].value;
                    text = text.replace(tradingTerm.tradingTermFormat,"<b><span>"+defaultValue+"</span></b>");
                }
            }

            element.innerHTML = text;

        } else{
            let element = document.getElementById(this.generateIdForClause(index));
            let clause = this.defaultTermAndConditionClauses[index];
            let text = clause.content[0].value;

            // replace placeholders with spans
            for(let tradingTerm of clause.tradingTerms){
                let parameter = tradingTerm.tradingTermFormat;
                // for the quantities, we have value and unit
                if(tradingTerm.value.valueQualifier == "QUANTITY"){
                    let defaultValue = this.tradingTerms.get(parameter).value.valueQuantity[0].value;
                    let defaultUnit = this.tradingTerms.get(parameter).value.valueQuantity[0].unitCode;
                    text = text.replace(parameter,"<b><span id='"+this.generateIdForParameter(parameter)+"'>"+defaultValue+" "+defaultUnit+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "STRING"){
                    let defaultValue = this.tradingTerms.get(parameter).value.value[0].value;
                    text = text.replace(parameter,"<b><span id='"+this.generateIdForParameter(parameter)+"'>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                    let defaultValue = this.tradingTerms.get(parameter).value.valueDecimal[0].toString();
                    text = text.replace(parameter,"<b><span id='"+this.generateIdForParameter(parameter)+"'>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "CODE"){
                    let defaultValue = this.tradingTerms.get(parameter).value.valueCode[0].value;
                    text = text.replace(parameter,"<b><span id='"+this.generateIdForParameter(parameter)+"'>"+defaultValue+"</span></b>");
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
                if(tradingTerm.tradingTermFormat == id){
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

    private getClause(sectionName:string){
        for(let clause of this.termsAndConditions){
            let text = clause.content[0].value;
            let startIndex = text.indexOf(" ");
            let endIndex = text.indexOf(":");
            let name = text.substring(startIndex+1,endIndex);
            if(endIndex == -1){
                name = "PURCHASE ORDER TERMS AND CONDITIONS";
            }
            if(sectionName == name){
                return clause;
            }
        }
    }

    getClauseName(clause:Clause){
        let startIndex = clause.content[0].value.indexOf(" ");
        let endIndex = clause.content[0].value.indexOf(":");

        if(endIndex == -1){
            return "PURCHASE ORDER TERMS AND CONDITIONS";
        }
        return clause.content[0].value.substring(startIndex+1,endIndex);
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
                    if(tradingTerm.tradingTermFormat == id){

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

    get selectedTradingTerms():TradingTerm[]{
        return this._selectedTradingTerms;
    }

    @Input('selectedTradingTerms')
    set selectedTradingTerms(tradingTerms:TradingTerm[]){
        this._selectedTradingTerms = [];
        // get the selected trading term
        for(let tradingTerm of tradingTerms){
            if(tradingTerm.value.value[0].value == "true"){
                this._selectedTradingTerms.push(tradingTerm);
                break;
            }
        }
        // construct to value representing the selected trading term
        let value = this._selectedTradingTerms[0].tradingTermFormat + " - " + this._selectedTradingTerms[0].description[0].value;

        this.updateTermNegotiating("$payment_id", value);
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
                    if(tradingTerm.tradingTermFormat == id){
                        this.updateTermNegotiating(id, tradingTerm.value.valueCode[0].value);
                        break;
                    }
                }
            }
        }
        // otherwise, use the selected trading terms
        else if(this._selectedTradingTerms){
            // construct to value representing the selected trading term
            let value = this._selectedTradingTerms[0].tradingTermFormat + " - " + this._selectedTradingTerms[0].description[0].value;
            this.updateTermNegotiating(id, value);

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
