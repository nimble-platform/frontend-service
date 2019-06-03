import {Component, Input, OnInit} from '@angular/core';
import {TradingTerm} from '../model/publish/trading-term';
import {Text} from "../model/publish/text";
import {MultiTypeValue} from "../model/publish/multi-type-value";

@Component({
    selector: 'payment-terms-view',
    templateUrl: './payment-terms-view.html'
})
export class PaymentTermsView implements OnInit{
    @Input() tradingTerms: TradingTerm[];
    @Input() presentationMode:string;
    initialTradingTerms: TradingTerm[] = [];

    ngOnInit(){
        // create initial trading terms list
        this.createTradingTerms();

        // ids of the selected trading terms
        let idList = [];
        for(let tradingTerm of this.tradingTerms){
            idList.push(tradingTerm.id);
        }

        for(let tradingTerm of this.initialTradingTerms){
            if(idList.indexOf(tradingTerm.id) != -1){
                continue;
            }
            this.tradingTerms.push(tradingTerm);
        }
    }

    private createTradingTerms(){
        this.initialTradingTerms.push(new TradingTerm("Payment_In_Advance",[new Text("Payment in advance")],"PIA",new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)));
        this.initialTradingTerms.push(new TradingTerm("Values_Net",[new Text("e.g.,NET 10,payment 10 days after invoice date")],"Net %s",null));
        this.initialTradingTerms.push(new TradingTerm("End_of_month",[new Text("End of month")],"EOM",new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)));
        this.initialTradingTerms.push(new TradingTerm("Cash_next_delivery",[new Text("Cash next delivery")],"CND",new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)));
        this.initialTradingTerms.push(new TradingTerm("Cash_before_shipment",[new Text("Cash before shipment")],"CBS",new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)));
        this.initialTradingTerms.push(new TradingTerm("Values_MFI",[new Text("e.g.,21 MFI,21st of the month following invoice date")],"%s MFI", null));
        this.initialTradingTerms.push(new TradingTerm("Values_/NET",[new Text("e.g.,1/10 NET 30,1% discount if payment received within 10 days otherwise payment 30 days after invoice date")],"%s/%s NET %s",null));
        this.initialTradingTerms.push(new TradingTerm("Cash_on_delivery",[new Text("Cash on delivery")],"COD",new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)));
        this.initialTradingTerms.push(new TradingTerm("Cash_with_order",[new Text("Cash with order")],"CWO",new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)));
        this.initialTradingTerms.push(new TradingTerm("Cash_in_advance",[new Text("Cash in advance")],"CIA",new MultiTypeValue(null, 'STRING', [new Text("false")], null, null)));
    }

    private get(id) : TradingTerm{
        for(let tradingTerm of this.tradingTerms){
            if(tradingTerm.id == id){
                return tradingTerm;
            }
        }
    }
}
