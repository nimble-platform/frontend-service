import {Component, Input, OnInit} from '@angular/core';
import { Order } from "../../../catalogue/model/publish/order";
import { CallStatus } from "../../../common/call-status";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { BPEService } from "../../bpe.service";
import { Party } from "../../../catalogue/model/publish/party";


@Component({
    selector: "terms-and-conditions",
    templateUrl: "./terms-and-conditions.component.html"
})
export class TermsAndConditionsComponent implements OnInit {

    @Input() order:Order;
    @Input() buyerParty:Party;
    @Input() sellerParty:Party;

    showPreview: boolean = false;
    callStatus : CallStatus = new CallStatus();

    termsAndConditions:any;

    showSection:boolean[] = [];

    valuesOfParameters:Map<string,string> = null;

    constructor(public bpeService: BPEService) {

    }

    ngOnInit(): void {

    }

    fetchTermsAndConditions(){
        this.clearShowSectionArray();
        this.showPreview = !this.showPreview;

        if(this.showPreview) {
            this.callStatus.submit();
            this.bpeService.getTermsAndConditions(this.order, UBLModelUtils.getPartyId(this.buyerParty), UBLModelUtils.getPartyId(this.sellerParty))
                .then(termsAndConditions => {
                    this.callStatus.callback("Successfully fetched terms and conditions", true);
                    this.termsAndConditions = termsAndConditions;
                    // fill the map
                    if(!this.valuesOfParameters){
                        this.valuesOfParameters = new Map<string, string>();
                        for(let paragraph of this.termsAndConditions.sections){
                            for(let i = 0; i < paragraph.parameters.length;i++){
                                this.valuesOfParameters.set(paragraph.parameters[i],paragraph.defaultValues[i]);
                            }
                        }
                    }
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
    }

    updateParameter(id:string,value:string){
        let element = document.getElementById(id);
        element.innerText = value;
        this.valuesOfParameters.set(id,value);
    }

}