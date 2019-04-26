import {Component, Input, OnInit} from '@angular/core';
import { Order } from "../../../catalogue/model/publish/order";
import { CallStatus } from "../../../common/call-status";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { BPEService } from "../../bpe.service";
import { Party } from "../../../catalogue/model/publish/party";
import {Contract} from '../../../catalogue/model/publish/contract';
import {Clause} from '../../../catalogue/model/publish/clause';
import {Text} from '../../../catalogue/model/publish/text';


@Component({
    selector: "terms-and-conditions",
    templateUrl: "./terms-and-conditions.component.html",
    styleUrls: ["./terms-and-conditions.component.css"]
})
export class TermsAndConditionsComponent implements OnInit {

    @Input() order:Order;
    @Input() buyerParty:Party;
    @Input() sellerParty:Party;
    @Input() readOnly:boolean = false;

    showPreview: boolean = false;
    callStatus : CallStatus = new CallStatus();

    termsAndConditions:any;

    showSection:boolean[] = [];

    // used to store values of parameters inside the terms and conditions text
    valuesOfParameters:Map<string,string> = null;
    // contract containing the terms and conditions details
    contract:Contract = null;

    constructor(public bpeService: BPEService) {

    }

    ngOnInit(): void {
        this.getTermsAndConditionsContract();
    }

    fetchTermsAndConditions(){
        this.clearShowSectionArray();
        this.showPreview = !this.showPreview;

        if(this.showPreview) {
            this.callStatus.submit();
            this.bpeService.getTermsAndConditions(this.order, UBLModelUtils.getPartyId(this.buyerParty), UBLModelUtils.getPartyId(this.sellerParty))
                .then(termsAndConditions => {
                    this.termsAndConditions = termsAndConditions;
                    // create valuesOfParameters map
                    if(!this.valuesOfParameters){
                        this.valuesOfParameters = new Map<string, string>();

                        // fill the map
                        // if we have the contract containing terms details, then use it to fill the map
                        if(this.contract){
                            for(let clause of this.contract.clause){
                                let sectionText:string = clause.content[0].value;
                                // find the index of parameter
                                let indexOfParameter = sectionText.indexOf("<span");
                                while (indexOfParameter != -1){
                                    // find the parameter value
                                    sectionText = sectionText.substring(indexOfParameter);
                                    // find the parameter id
                                    let indexIdStart = sectionText.indexOf("id")+4;
                                    let indexIdEnd = sectionText.indexOf(">")-1;
                                    let id = sectionText.substring(indexIdStart,indexIdEnd);

                                    let indexValueEnd = sectionText.indexOf("</span>");
                                    // find the parameter value
                                    let value = sectionText.substring(indexIdEnd+2,indexValueEnd);
                                    // add <id,value> to map
                                    this.valuesOfParameters.set(id,value);

                                    let indexCloseTag = sectionText.indexOf("</b>");
                                    sectionText = sectionText.substring(indexCloseTag+4);
                                    // find the index of parameter
                                    indexOfParameter = sectionText.indexOf("<span");
                                }
                            }
                        }
                        // otherwise fill the map using the default values of parameters
                        else{
                            for(let section of this.termsAndConditions.sections){
                                for(let i = 0; i < section.parameters.length;i++){
                                    this.valuesOfParameters.set(section.parameters[i],section.defaultValues[i]);
                                }
                            }
                        }
                    }
                    // create the contract
                    if(!this.contract){
                        // create a contract for Terms and Conditions
                        this.contract = new Contract();
                        this.contract.id = UBLModelUtils.generateUUID();
                        let size = this.termsAndConditions.sections.length;
                        for(let i = 0; i < size; i++){
                            // create a clause for the section
                            let clause:Clause = new Clause();
                            clause.id = UBLModelUtils.generateUUID();
                            this.contract.clause.push(clause);
                        }
                        // set clause contents
                        this.setClauseContents();
                        // push contract to order.contract
                        this.order.contract.push(this.contract);
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
            let section = this.termsAndConditions.sections[index];

            let element = document.getElementById("section"+index);
            element.innerHTML = this.getClause(section.name).content[0].value;

        } else{
            let element = document.getElementById("section"+index);
            let section = this.termsAndConditions.sections[index];
            let text = section.text;
            // replace placeholders with spans
            for(let j = 0; j < section.parameters.length; j++){
                let parameter = section.parameters[j];
                let defaultValue = this.valuesOfParameters.get(parameter);
                text = text.replace(parameter,"<b><span id='"+parameter+"'>"+defaultValue+"</span></b>");
            }
            element.innerHTML = text;

            this.getClause(section.name).content[0].value = element.innerText;
        }
    }

    updateParameter(sectionIndex:number,id:string,value:string){
        let element = document.getElementById(id);
        element.innerText = value;
        this.valuesOfParameters.set(id,value);

        if(!this.readOnly){
            let sectionName = this.termsAndConditions.sections[sectionIndex].name;

            let textElement = document.getElementById("section"+sectionIndex);
            this.getClause(sectionName).content[0].value = textElement.innerHTML;
        }
    }

    private getClause(sectionName:string){
        for(let clause of this.contract.clause){
            let text = clause.content[0].value;
            let startIndex = text.indexOf(" ");
            let endIndex = text.indexOf(":");
            let name = text.substring(startIndex+1,endIndex);
            if(endIndex == -1){
                name = "Purchase Order Terms and Conditions";
            }
            if(sectionName == name){
                return clause;
            }
        }
    }

    private setClauseContents(){
        let numberOfSections = this.termsAndConditions.sections.length;
        for(let sectionIndex = 0; sectionIndex < numberOfSections; sectionIndex++){
            let section = this.termsAndConditions.sections[sectionIndex];
            let text = section.text;
            for(let i = 0 ; i < section.parameters.length; i++){
                let parameter = section.parameters[i];
                let defaultValue = this.valuesOfParameters.get(parameter);
                text = text.replace(parameter,"<b><span id='"+parameter+"'>"+defaultValue+"</span></b>");
            }
            this.contract.clause[sectionIndex].content = [new Text(text,"en")];
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
}