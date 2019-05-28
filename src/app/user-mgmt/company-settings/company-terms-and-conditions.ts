import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { AppComponent } from "../../app.component";
import {CompanySettings} from '../model/company-settings';
import {TradingTerm} from '../../catalogue/model/publish/trading-term';
import {deliveryPeriodUnitListId, warrantyPeriodUnitListId} from '../../common/constants';
import {Clause} from '../../catalogue/model/publish/clause';
import {CallStatus} from '../../common/call-status';
import {COUNTRY_NAMES} from '../../common/utils';
import {UnitService} from '../../common/unit-service';
import {BPEService} from '../../bpe/bpe.service';
import {EditTradingTermModalComponent} from './edit-trading-term-modal.component';
import {Text} from '../../catalogue/model/publish/text';

@Component({
    selector: "company-terms-and-conditions",
    templateUrl: "./company-terms-and-conditions.html",
    styleUrls: ["./company-terms-and-conditions.css"]
})
export class CompanyTermsAndConditions implements OnInit {

    @Input() settings: CompanySettings = null;

    pageInitCallStatus:CallStatus = new CallStatus();

    // default terms and conditions which are retrieved from the server
    defaultTermsAndConditions: Clause[] = null;

    // terms and conditions of the company
    termsAndConditions: Clause[] = [];

    // clause id-boolean map
    showSection: Map<string,boolean> = new Map<string, boolean>();

    // options
    INCOTERMS: string[] = [];
    PAYMENT_TERMS:string[] = [];
    COUNTRY_NAMES = COUNTRY_NAMES;
    UNITS:string[] = [];

    @ViewChild(EditTradingTermModalComponent)
    private editTradingTermModelComponent: EditTradingTermModalComponent;

    constructor(public route: ActivatedRoute,
                public appComponent: AppComponent,
                public unitService: UnitService,
                public bpeService: BPEService) {

    }

    ngOnInit(): void {
        this.pageInitCallStatus.submit();

        Promise.all([
            this.unitService.getCachedUnitList(deliveryPeriodUnitListId),
            this.unitService.getCachedUnitList(warrantyPeriodUnitListId),
            this.bpeService.getTermsAndConditions(null,null, this.settings.companyID, null, null,null),
        ]).then(([ deliveryPeriodUnits, warrantyPeriodUnits,defaultTermsAndConditions]) => {

            // populate available incoterms
            this.INCOTERMS = this.settings.negotiationSettings.incoterms;
            // populate available payment terms
            this.PAYMENT_TERMS = this.settings.negotiationSettings.paymentTerms;
            // populate available units
            this.UNITS = deliveryPeriodUnits.concat(warrantyPeriodUnits);

            // set the default terms and conditions
            if(defaultTermsAndConditions){
                this.defaultTermsAndConditions = defaultTermsAndConditions;
            }

            this.pageInitCallStatus.callback("Successfully initialized the page", true);
        }).catch(error => {
            this.pageInitCallStatus.error("Error while initializing the page",error);
        });
    }

    // called when the user selects a clause among the default ones
    onClauseSelection(clause:Clause, isChecked:boolean){
        if(isChecked){
            // add clause
            this.termsAndConditions.push(clause);
            // update the showSection map
            this.showSection.set(clause.id, false);
        }
        else{
            // remove clause
            this.onRemoveClause(clause);
        }
    }

    // called when the user updated the id of clause
    onClauseIdUpdated(oldId:string, index:number, newId: string){
        // update the showSection map
        this.showSection.delete(oldId);
        this.showSection.set(newId, true);
        // update the clause id
        this.termsAndConditions[index].id = newId;
    }

    // used to update clause content on UI
    setSectionText(clause:Clause){
        // get the clause content
        let text = clause.content[0].value;
        // get the element representing the clause content
        let element = document.getElementById(clause.id);
        // replace placeholders with spans
        for(let tradingTerm of clause.tradingTerms){
            let id = tradingTerm.id;

            text = text.replace(id, "<b><span id='"+clause.id+"-"+id+"'>" + id + "</span></b>");

        }
        // update the element's innerHTML
        element.innerHTML = text;

        // make every trading term id non-editable
        for(let tradingTerm of clause.tradingTerms){
            let id = tradingTerm.id;

            element = document.getElementById(clause.id+"-"+id);

            element.contentEditable = "false";
        }
    }

    // this method is called when the user changes the content of clause
    onContentUpdated(clause:Clause, event:any){
        // check whether the parameters are deleted or not
        for(let tradingTerm of clause.tradingTerms){
            if(event.target.innerText.indexOf(tradingTerm.id) == -1){
                // since there is a missing trading term, we need to set section text again
                this.setSectionText(clause);
                return;
            }
        }
        clause.content[0].value = event.target.innerText;
    }

    // methods used to add/edit/remove trading terms
    onAddTradingTerm(clause:Clause){
        let element = document.getElementById(clause.id);
        this.editTradingTermModelComponent.open(clause.tradingTerms,clause,element);
    }

    onEditTradingTerm(clause:Clause, tradingTerm:TradingTerm){
        let element = document.getElementById(clause.id);
        this.editTradingTermModelComponent.open(clause.tradingTerms,clause,element, tradingTerm);
    }

    onRemoveTradingTerm(clause:Clause, tradingTerm:TradingTerm){
        // remove trading term from the clause
        clause.tradingTerms.splice(clause.tradingTerms.indexOf(tradingTerm),1);
        // remove trading term id from the clause content
        clause.content[0].value = clause.content[0].value.replace(tradingTerm.id,"");
        // update the content of corresponding section
        this.setSectionText(clause);
    }

    // used to set the value of trading terms whose data type is NUMBER
    setValueDecimal(tradingTerm:TradingTerm, i: number, event: any) {
        tradingTerm.value.valueDecimal[i] = event.target.value;
    }

    // methods used to add/remove clause
    onAddClause(){
        let clause = new Clause();
        // generate an id for the clause
        let id = "Title of clause";
        let idExists = this.showSection.has(id);
        let number = 1;
        while(idExists){
            id += number;
            idExists = this.showSection.has(id);
        }
        // set the id of clause
        clause.id = id;
        // set the content of clause
        clause.content[0] = new Text('');
        // add clause
        this.termsAndConditions.push(clause);
        // update the showSection map
        this.showSection.set(clause.id, false);
    }

    onRemoveClause(clause:Clause){
        // remove clause
        this.termsAndConditions.splice(this.termsAndConditions.indexOf(clause),1);
        // update the showSection map
        this.showSection.delete(clause.id);
    }
}
