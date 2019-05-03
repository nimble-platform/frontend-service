import {Component, Input, OnInit} from '@angular/core';
import { Order } from "../../../catalogue/model/publish/order";
import { CallStatus } from "../../../common/call-status";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { BPEService } from "../../bpe.service";
import { Party } from "../../../catalogue/model/publish/party";
import {Contract} from '../../../catalogue/model/publish/contract';
import {Clause} from '../../../catalogue/model/publish/clause';
import {Text} from '../../../catalogue/model/publish/text';
import {UserService} from '../../../user-mgmt/user.service';
import {COUNTRY_NAMES} from '../../../common/utils';
import {UnitService} from '../../../common/unit-service';
import {deliveryPeriodUnitListId, warrantyPeriodUnitListId} from '../../../common/constants';
import {TradingTerm} from '../../../catalogue/model/publish/trading-term';
import {RequestForQuotation} from '../../../catalogue/model/publish/request-for-quotation';
import {Quotation} from '../../../catalogue/model/publish/quotation';


@Component({
    selector: "terms-and-conditions",
    templateUrl: "./terms-and-conditions.component.html",
    styleUrls: ["./terms-and-conditions.component.css"]
})
export class TermsAndConditionsComponent implements OnInit {

    @Input() order:Order;
    @Input() requestForQuotation: RequestForQuotation;
    @Input() quotation: Quotation;
    @Input() buyerPartyId:string;
    @Input() sellerPartyId:string;
    @Input() readOnly:boolean = false;
    @Input() rfqId:string = null;

    showPreview: boolean = false;
    callStatus : CallStatus = new CallStatus();

    termAndConditionClauses:Clause[];

    showSection:boolean[] = [];

    // used to store values of parameters inside the terms and conditions text
    tradingTerms:Map<string,TradingTerm> = null;
    // contract containing the terms and conditions details
    contract:Contract = null;

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

        this.callStatus.submit();

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

            if(this.order){
                this.getTermsAndConditionsContract();
            }
            this.callStatus.callback("Successfully fetched terms and conditions", true);
        }).catch(error => {
            this.callStatus.error("Error while getting the settings of parties",error);
        });
    }

    fetchTermsAndConditions(){
        this.clearShowSectionArray();
        this.showPreview = !this.showPreview;

        if(this.showPreview) {
            this.callStatus.submit();
            this.bpeService.getTermsAndConditions(this.order,this.requestForQuotation,this.quotation, this.buyerPartyId, this.sellerPartyId, this.rfqId)
                .then(termsAndConditions => {
                    this.termAndConditionClauses = termsAndConditions;
                    // create valuesOfParameters map
                    if(!this.tradingTerms){
                        this.tradingTerms = new Map<string, TradingTerm>();

                        // fill the map
                        // if we have the contract containing terms details, then use it to fill the map
                        if(this.contract){
                            for(let clause of this.contract.clause){
                                for(let tradingTerm of clause.tradingTerms){
                                    this.tradingTerms.set(tradingTerm.tradingTermFormat,tradingTerm);
                                }
                            }
                        }
                        // if we have request for quotation, then use its terms and conditions to fill the map
                        else if(this.requestForQuotation && this.requestForQuotation.termOrCondition.length > 0){
                            for(let clause of this.requestForQuotation.termOrCondition){
                                for(let tradingTerm of clause.tradingTerms){
                                    this.tradingTerms.set(tradingTerm.tradingTermFormat,tradingTerm);
                                }
                            }
                        }
                        // if we have a quotation, then use its terms and conditions to fill the map
                        else if(this.quotation && this.quotation.termOrCondition.length > 0){
                            for(let clause of this.quotation.termOrCondition){
                                for(let tradingTerm of clause.tradingTerms){
                                    this.tradingTerms.set(tradingTerm.tradingTermFormat,tradingTerm);
                                }
                            }
                        }
                        // otherwise fill the map using the default values of parameters
                        else{

                            for(let clause of this.termAndConditionClauses){
                                for(let tradingTerm of clause.tradingTerms){
                                    this.tradingTerms.set(tradingTerm.tradingTermFormat,JSON.parse(JSON.stringify(tradingTerm)));
                                }
                            }
                        }
                    }
                    // create the contract
                    if(this.order && !this.contract){
                        // create a contract for Terms and Conditions
                        this.contract = new Contract();
                        this.contract.id = UBLModelUtils.generateUUID();

                        for(let clause of this.termAndConditionClauses){

                            let newClause:Clause = JSON.parse(JSON.stringify(clause));
                            newClause.id = UBLModelUtils.generateUUID();
                            this.contract.clause.push(newClause);
                        }
                        // push contract to order.contract
                        this.order.contract.push(this.contract);
                    }
                    // create term and conditions for request for quotation
                    if(this.requestForQuotation && this.requestForQuotation.termOrCondition.length == 0){
                        for(let clause of this.termAndConditionClauses){

                            let newClause:Clause = JSON.parse(JSON.stringify(clause));
                            newClause.id = UBLModelUtils.generateUUID();
                            this.requestForQuotation.termOrCondition.push(newClause);
                        }
                    }
                    // create term and conditions for quotation
                    if(this.quotation && this.quotation.termOrCondition.length == 0){
                        for(let clause of this.termAndConditionClauses){

                            let newClause:Clause = JSON.parse(JSON.stringify(clause));
                            newClause.id = UBLModelUtils.generateUUID();
                            this.quotation.termOrCondition.push(newClause);
                        }
                    }
                    this.callStatus.callback("Successfully fetched terms and conditions", true);
                }).catch(error => {
                this.callStatus.error("Error while fetching terms and conditions", error);
            });
        }
    }

    clearShowSectionArray(){
        for(let i = 0; i < 19; i++){
            this.showSection[i] = false;
        }
    }

    setSectionText(index:number){
        if(this.readOnly){
            let clause = this.termAndConditionClauses[index];

            let element = document.getElementById("clause"+index);

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
            let element = document.getElementById("clause"+index);
            let clause = this.termAndConditionClauses[index];
            let text = clause.content[0].value;

            // replace placeholders with spans
            for(let tradingTerm of clause.tradingTerms){
                let parameter = tradingTerm.tradingTermFormat;
                // for the quantities, we have value and unit
                if(tradingTerm.value.valueQualifier == "QUANTITY"){
                    let defaultValue = this.tradingTerms.get(parameter).value.valueQuantity[0].value;
                    let defaultUnit = this.tradingTerms.get(parameter).value.valueQuantity[0].unitCode;
                    text = text.replace(parameter,"<b><span id='"+parameter+"'>"+defaultValue+" "+defaultUnit+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "STRING"){
                    let defaultValue = this.tradingTerms.get(parameter).value.value[0].value;
                    text = text.replace(parameter,"<b><span id='"+parameter+"'>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                    let defaultValue = this.tradingTerms.get(parameter).value.valueDecimal[0].toString();
                    text = text.replace(parameter,"<b><span id='"+parameter+"'>"+defaultValue+"</span></b>");
                } else if(tradingTerm.value.valueQualifier == "CODE"){
                    let defaultValue = this.tradingTerms.get(parameter).value.valueCode[0].value;
                    text = text.replace(parameter,"<b><span id='"+parameter+"'>"+defaultValue+"</span></b>");
                }
            }

            element.innerHTML = text;
        }
    }

    updateParameter(sectionIndex:number,id:string,value:string,isUnit:boolean = false){
        // handling of empty string
        if(value == ""){
            let clause = this.termAndConditionClauses[sectionIndex];

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

        // get the corresponding trading term from contract
        let contractTradingTerm:TradingTerm = null;
        if(this.contract){

            let clauseName = this.getClauseName(this.termAndConditionClauses[sectionIndex]);
            let contractClause = this.getClause(clauseName);
            for(let tradingTerm of contractClause.tradingTerms){
                if(tradingTerm.tradingTermFormat == id){
                    contractTradingTerm = tradingTerm;
                    break;
                }
            }
        }

        // get the corresponding trading term from request for quotation
        let rfqTradingTerm:TradingTerm = null;
        if(this.requestForQuotation){
            let clauseName = this.getClauseName(this.termAndConditionClauses[sectionIndex]);
            let rfqClause = this.getClause(clauseName);
            for(let tradingTerm of rfqClause.tradingTerms){
                if(tradingTerm.tradingTermFormat == id){
                    rfqTradingTerm = tradingTerm;
                    break;
                }
            }
        }

        // get the corresponding trading term from quotation
        let quotationTradingTerm:TradingTerm = null;
        if(this.quotation){
            let clauseName = this.getClauseName(this.termAndConditionClauses[sectionIndex]);
            let quotationClause = this.getClause(clauseName);
            for(let tradingTerm of quotationClause.tradingTerms){
                if(tradingTerm.tradingTermFormat == id){
                    quotationTradingTerm = tradingTerm;
                    break;
                }
            }
        }

        if(isUnit){
            this.tradingTerms.get(id).value.valueQuantity[0].unitCode = value;

            if(contractTradingTerm){
                contractTradingTerm.value.valueQuantity[0].unitCode = value;
            } else if(rfqTradingTerm){
                rfqTradingTerm.value.valueQuantity[0].unitCode = value;
            } else if(quotationTradingTerm){
                quotationTradingTerm.value.valueQuantity[0].unitCode = value;
            }

            let element = document.getElementById(id);
            element.innerText = this.tradingTerms.get(id).value.valueQuantity[0].value +" "+ value;
        } else{
            let tradingTerm = this.tradingTerms.get(id);
            if(tradingTerm.value.valueQualifier == "STRING"){
                tradingTerm.value.value[0].value = value;

                if(contractTradingTerm){
                    contractTradingTerm.value.value[0].value = value;
                } else if(rfqTradingTerm){
                    rfqTradingTerm.value.value[0].value = value;
                } else if(quotationTradingTerm){
                    quotationTradingTerm.value.value[0].value = value;
                }

            } else if(tradingTerm.value.valueQualifier == "NUMBER"){
                tradingTerm.value.valueDecimal[0] = Number(value);

                if(contractTradingTerm){
                    contractTradingTerm.value.valueDecimal[0] = Number(value);
                } else if(rfqTradingTerm){
                    rfqTradingTerm.value.valueDecimal[0] = Number(value);
                } else if(quotationTradingTerm){
                    quotationTradingTerm.value.valueDecimal[0] = Number(value);
                }

            } else if(tradingTerm.value.valueQualifier == "QUANTITY"){
                tradingTerm.value.valueQuantity[0].value = Number(value);

                if(contractTradingTerm){
                    contractTradingTerm.value.valueQuantity[0].value = Number(value);
                } else if(rfqTradingTerm){
                    rfqTradingTerm.value.valueQuantity[0].value = Number(value);
                } else if(quotationTradingTerm){
                    quotationTradingTerm.value.valueQuantity[0].value = Number(value);
                }

            } else if(tradingTerm.value.valueQualifier == "CODE"){
                tradingTerm.value.valueCode[0].value = value;

                if(contractTradingTerm){
                    contractTradingTerm.value.valueCode[0].value = value;
                } else if(rfqTradingTerm){
                    rfqTradingTerm.value.valueCode[0].value = value;
                } else if(quotationTradingTerm){
                    quotationTradingTerm.value.valueCode[0].value = value;
                }

            }

            let element = document.getElementById(id);

            if(tradingTerm.value.valueQualifier == "QUANTITY"){
                element.innerText = value + " " + tradingTerm.value.valueQuantity[0].unitCode;
            } else{
                element.innerText = value;
            }
        }
    }

    private getClause(sectionName:string){
        let clauses: Clause[];

        if(this.contract){
            clauses = this.contract.clause;
        } else if(this.requestForQuotation){
            clauses = this.requestForQuotation.termOrCondition;
        } else if(this.quotation){
            clauses = this.quotation.termOrCondition;
        }
        for(let clause of clauses){
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

    // get the contract containing the terms and conditions details
    private getTermsAndConditionsContract(){
        for(let contract of this.order.contract){
            for(let clause of contract.clause){
                if(!clause.type){
                    this.contract = contract;
                    break;
                }
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
}
