import {Component, Input, OnInit} from '@angular/core';
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

    @Input() orderId:string = null;
    @Input() buyerPartyId:string;
    @Input() sellerPartyId:string;
    @Input() readOnly:boolean = false;
    @Input() rfqId:string = null;
    @Input() documentType:string; // "order", "rfq", "quotation";
    @Input() selectedIncoterm: string = null;
    @Input() selectedTradingTerms: TradingTerm[] = [];
    @Input() termsAndConditions:Clause[];

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

    constructor(public bpeService: BPEService,
                public userService: UserService,
                public unitService: UnitService) {

    }

    ngOnInit(): void {
        console.log(this.termsAndConditions)
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

            // create valuesOfParameters map
            if(!this.tradingTerms){
                this.tradingTerms = new Map<string, TradingTerm>();

                // if we already have terms and conditions, use them to fill the map
                if(this.termsAndConditions.length > 0){
                    for(let clause of this.termsAndConditions){
                        for(let tradingTerm of clause.tradingTerms){
                            this.tradingTerms.set(tradingTerm.tradingTermFormat,tradingTerm);
                        }
                    }
                }
                // otherwise fill the map using the default values of parameters
                else{
                    for(let clause of this.defaultTermAndConditionClauses){
                        for(let tradingTerm of clause.tradingTerms){
                            this.tradingTerms.set(tradingTerm.tradingTermFormat,JSON.parse(JSON.stringify(tradingTerm)));
                        }
                    }
                }
            }

            // create terms and conditions if we do not have any
            if(this.termsAndConditions.length == 0){
                for(let clause of this.defaultTermAndConditionClauses){
                    let newClause:Clause = JSON.parse(JSON.stringify(clause));
                    newClause.id = UBLModelUtils.generateUUID();
                    this.termsAndConditions.push(newClause);
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

        let tradingTermToBeUpdated:TradingTerm;
        let clauseName = this.getClauseName(this.defaultTermAndConditionClauses[sectionIndex]);
        let clause = this.getClause(clauseName);
        for(let tradingTerm of clause.tradingTerms){
            if(tradingTerm.tradingTermFormat == id){
                tradingTermToBeUpdated = tradingTerm;
                break;
            }
        }

        if(isUnit){
            this.tradingTerms.get(id).value.valueQuantity[0].unitCode = value;

            tradingTermToBeUpdated.value.valueQuantity[0].unitCode = value;

            let element = document.getElementById(this.generateIdForParameter(id));
            element.innerText = this.tradingTerms.get(id).value.valueQuantity[0].value +" "+ value;
        } else{
            let tradingTerm = this.tradingTerms.get(id);
            if(tradingTerm.value.valueQualifier == "STRING"){
                tradingTerm.value.value[0].value = value;

                tradingTermToBeUpdated.value.value[0].value = value;
            } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                tradingTerm.value.valueDecimal[0] = Number(value);

                tradingTermToBeUpdated.value.valueDecimal[0] = Number(value);
            } else if(tradingTerm.value.valueQualifier == "QUANTITY"){
                tradingTerm.value.valueQuantity[0].value = Number(value);

                tradingTermToBeUpdated.value.valueQuantity[0].value = Number(value);

            } else if(tradingTerm.value.valueQualifier == "CODE"){
                tradingTerm.value.valueCode[0].value = value;

                tradingTermToBeUpdated.value.valueCode[0].value = value;
            }

            let element = document.getElementById(this.generateIdForParameter(id));

            if(tradingTerm.value.valueQualifier == "QUANTITY"){
                element.innerText = value + " " + tradingTerm.value.valueQuantity[0].unitCode;
            } else{
                element.innerText = value;
            }
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
}
