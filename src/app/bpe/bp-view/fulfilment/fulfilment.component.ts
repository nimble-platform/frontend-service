import {Component, Input, OnInit} from '@angular/core';
import {BPDataService} from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import {CallStatus} from '../../../common/call-status';
import {BPEService} from '../../bpe.service';
import {Item} from '../../../catalogue/model/publish/item';

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "fulfilment",
    templateUrl: "./fulfilment.component.html"
})
export class FulfilmentComponent implements OnInit {
    
    line: CatalogueLine;
    _selectedCatalogueLine:CatalogueLine;

    fulfilmentStatistics = null;

    constructor(private bpDataService:BPDataService,
                private bpeService: BPEService) {

    }

    green_perc = 0;
    yellow_perc = 0;
    red_perc = 0;
    green_perc_str = "0%";
    yellow_perc_str = "0%";
    red_perc_str = "0%";
    blueTotalDispatched = 0;
    greenTotalAccepted = 0;
    yellowTotalWaiting = 0;
    redTotalRejected = 0;

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
            this.fulfilmentStatistics = result;
            this.updateFulfilmentStatisticsView(this.selectedLine.goodsItem.item);

            this.fulfilmentStatisticsCallStatus.callback(null,true);
        }).catch(error => {
            this.fulfilmentStatisticsCallStatus.error("Failed to get fulfilment statistics",error);
        })
    }

    isLoading(): boolean {
        return this.fulfilmentStatisticsCallStatus.fb_submitted;
    }

    @Input()
    set selectedLine(catalogueLine:CatalogueLine) {
        this._selectedCatalogueLine = catalogueLine;
        this.updateFulfilmentStatisticsView(catalogueLine.goodsItem.item)
    }

    get selectedLine(): CatalogueLine {
        return this._selectedCatalogueLine;
    }

    updateFulfilmentStatisticsView(item:Item){
        if(this.fulfilmentStatistics){
            for(let statistics of this.fulfilmentStatistics){
                if(statistics.item.catalogueDocumentReference.id == item.catalogueDocumentReference.id && statistics.item.manufacturersItemIdentification.id == item.manufacturersItemIdentification.id){
                    this.blueTotalDispatched = statistics.dispatchedQuantity;
                    this.greenTotalAccepted = statistics.dispatchedQuantity - statistics.rejectedQuantity;
                    this.redTotalRejected = statistics.rejectedQuantity;
                    let waitingQuantity = statistics.requestedQuantity - this.greenTotalAccepted;
                    this.yellowTotalWaiting = waitingQuantity > 0 ? waitingQuantity: 0;

                    // let total = this.blueTotalDispatched + this.greenTotalAccepted + this.redTotalRejected + this.yellowTotalWaiting;
                    let total = this.greenTotalAccepted + this.redTotalRejected + this.yellowTotalWaiting;

                    // this.blue_perc = Math.round(this.blueTotalDispatched*100/total);
                    this.green_perc = Math.round(this.greenTotalAccepted*100/total);
                    this.yellow_perc = Math.round(this.yellowTotalWaiting*100/total);
                    this.red_perc = Math.round(this.redTotalRejected*100/total);

                    // this.blue_perc_str = this.blue_perc+"%";
                    this.green_perc_str = this.green_perc+"%";
                    this.yellow_perc_str = this.yellow_perc+"%";
                    this.red_perc_str = (100 - this.green_perc - this.yellow_perc) +"%";

                    return;
                }
            }
        }
    }
}
