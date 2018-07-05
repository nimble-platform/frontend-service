import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TradingTerm} from '../model/publish/trading-term';

@Component({
    selector: 'payment-terms-view',
    templateUrl: './payment-terms-view.html'
})
export class PaymentTermsView implements OnInit{
    @Input() tradingTerms: TradingTerm[];
    @Input() presentationMode:string;

    @Output() onSelectChange = new EventEmitter();
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
        this.initialTradingTerms.push(new TradingTerm("Payment_In_Advance","Payment in advance","PIA",["false"]));
        this.initialTradingTerms.push(new TradingTerm("Values_Net","e.g.,NET 10,payment 10 days after invoice date","Net %s",[null]));
        this.initialTradingTerms.push(new TradingTerm("End_of_month","End of month","EOM",["false"]));
        this.initialTradingTerms.push(new TradingTerm("Cash_next_delivery","Cash next delivery","CND",["false"]));
        this.initialTradingTerms.push(new TradingTerm("Cash_before_shipment","Cash before shipment","CBS",["false"]));
        this.initialTradingTerms.push(new TradingTerm("Values_MFI","e.g.,21 MFI,21st of the month following invoice date","%s MFI", [null]));
        this.initialTradingTerms.push(new TradingTerm("Values_/NET","e.g.,1/10 NET 30,1% discount if payment received within 10 days otherwise payment 30 days after invoice date","%s/%s NET %s",[null,null,null]));
        this.initialTradingTerms.push(new TradingTerm("Cash_on_delivery","Cash on delivery","COD",["false"]));
        this.initialTradingTerms.push(new TradingTerm("Cash_with_order","Cash with order","CWO",["false"]));
        this.initialTradingTerms.push(new TradingTerm("Cash_in_advance","Cash in advance","CIA",["false"]));
    }

    private get(id) : TradingTerm{
        for(let tradingTerm of this.tradingTerms){
            if(tradingTerm.id == id){
                return tradingTerm;
            }
        }
    }
}