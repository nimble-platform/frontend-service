import {Component, Input, OnInit} from '@angular/core';
import {BPDataService} from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import {CallStatus} from '../../../common/call-status';
import {BPEService} from '../../bpe.service';
import {DespatchLine} from '../../../catalogue/model/publish/despatch-line';

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "fulfilment",
    templateUrl: "./fulfilment.component.html"
})
export class FulfilmentComponent implements OnInit {
    
    line: CatalogueLine;
    // hjids of the line items included in the order
    orderLineItemHjids: string[] = null;
    // order line index of the selected product
    _selectedOrderLineIndex:number = 0;

    @Input() catalogueLines:CatalogueLine[] = [];

    constructor(private bpDataService:BPDataService,
                private bpeService: BPEService) {

    }

    green_perc:number[] = [];
    yellow_perc:number[] = [];
    red_perc:number[] = [];
    green_perc_str:string[] = [];
    yellow_perc_str:string[] = [];
    red_perc_str:string[] = [];
    blueTotalDispatched:number[] = [];
    greenTotalAccepted:number[] = [];
    yellowTotalWaiting:number[] = [];
    redTotalRejected:number[] = [];

    fulfilmentStatisticsCallStatus: CallStatus = new CallStatus();

    ngOnInit() {
        this.line = this.bpDataService.getCatalogueLine();

        this.initializeFulfilmentStatisticsSection();
    }

    showReceiptAdvice(): boolean {
        return this.bpDataService.bpActivityEvent.userRole === "buyer" || !!this.bpDataService.receiptAdvice;
    }

    private initializeFulfilmentStatisticsSection(): void{
        let orderId;
        if(this.bpDataService.despatchAdvice){
            orderId = this.bpDataService.despatchAdvice.orderReference[0].documentReference.id;
        }
        // starting a new Despatch Advice following a Transport Execution Plan
        else if(this.bpDataService.productOrder){
            orderId = this.bpDataService.productOrder.id;
        }
        // starting a new Despatch Advice following an Order
        else if(this.bpDataService.copyOrder){
            orderId = this.bpDataService.copyOrder.id;
        }
        this.fulfilmentStatisticsCallStatus.submit();
        this.bpeService.getFulfilmentStatistics(orderId).then(result => {
            this.orderLineItemHjids = [];
            for(let statistics of result){
                this.orderLineItemHjids.push(statistics.lineItemHjid.toString());
                let blueTotalDispatched = statistics.dispatchedQuantity;
                let greenTotalAccepted = statistics.dispatchedQuantity - statistics.rejectedQuantity;
                let redTotalRejected = statistics.rejectedQuantity;
                let waitingQuantity = statistics.requestedQuantity - greenTotalAccepted;
                let yellowTotalWaiting = waitingQuantity > 0 ? waitingQuantity: 0;

                let total = greenTotalAccepted + redTotalRejected + yellowTotalWaiting;

                let green_perc = Math.round(greenTotalAccepted*100/total);
                let yellow_perc = Math.round(yellowTotalWaiting*100/total);
                let red_perc = Math.round(redTotalRejected*100/total);

                let green_perc_str = green_perc+"%";
                let yellow_perc_str = yellow_perc+"%";
                let red_perc_str = (100 - green_perc - yellow_perc) +"%";


                this.blueTotalDispatched.push(blueTotalDispatched);
                this.greenTotalAccepted.push(greenTotalAccepted);
                this.redTotalRejected.push(redTotalRejected);
                this.yellowTotalWaiting.push(yellowTotalWaiting);

                this.green_perc.push(green_perc);
                this.yellow_perc.push(yellow_perc);
                this.red_perc.push(red_perc);

                this.green_perc_str.push(green_perc_str);
                this.yellow_perc_str.push(yellow_perc_str);
                this.red_perc_str.push(red_perc_str);
            }

            this._selectedOrderLineIndex = this.getOrderLineIndex(0);

            this.fulfilmentStatisticsCallStatus.callback(null,true);
        }).catch(error => {
            this.fulfilmentStatisticsCallStatus.error("Failed to get fulfilment statistics",error);
        });
    }

    isLoading(): boolean {
        return this.fulfilmentStatisticsCallStatus.fb_submitted;
    }

    @Input()
    set selectedLineIndex(index:number) {
        this._selectedOrderLineIndex = this.getOrderLineIndex(index);
    }

    private getOrderLineIndex(index:number):number{
        let orderLineIndex:number = index;
        if(this.bpDataService.despatchAdvice && this.orderLineItemHjids){
            let dispatchAdviceLine:DespatchLine = this.bpDataService.despatchAdvice.despatchLine[index];
            // In TEP view,we show all products included in the order at the top,however, TEP itself can contain a subset of these products as goods items,
            // therefore, we may not have a dispatch line for the given index.
            // in this case, we can simply return the given index, because it corresponds to the correct order line index
            if(dispatchAdviceLine){
                let size = this.orderLineItemHjids.length;
                for(let i = 0; i < size; i++){
                    if(this.orderLineItemHjids[i] == dispatchAdviceLine.orderLineReference.lineID){
                        orderLineIndex = i;
                        break;
                    }
                }
            }
        }
        return orderLineIndex;
    }
}
