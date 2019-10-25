import {Component, Input, OnInit} from '@angular/core';
import {BPDataService} from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import {CallStatus} from '../../../common/call-status';
import {BPEService} from '../../bpe.service';

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "fulfilment",
    templateUrl: "./fulfilment.component.html"
})
export class FulfilmentComponent implements OnInit {
    
    line: CatalogueLine;
    _selectedLineIndex:number = 0;

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
            for(let line of this.catalogueLines){
                for(let statistics of result){
                    if(statistics.item.catalogueDocumentReference.id == line.goodsItem.item.catalogueDocumentReference.id && statistics.item.manufacturersItemIdentification.id == line.goodsItem.item.manufacturersItemIdentification.id){
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

                        break;
                    }
                }
            }

            this.fulfilmentStatisticsCallStatus.callback(null,true);
        }).catch(error => {
            this.fulfilmentStatisticsCallStatus.error("Failed to get fulfilment statistics",error);
        })
    }

    isLoading(): boolean {
        return this.fulfilmentStatisticsCallStatus.fb_submitted;
    }

    @Input()
    set selectedLineIndex(index:number) {
        this._selectedLineIndex = index;
    }

    get selectedLineIndex(): number {
        return this._selectedLineIndex;
    }

}
