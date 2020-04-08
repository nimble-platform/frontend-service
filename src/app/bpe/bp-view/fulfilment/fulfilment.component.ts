/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, Input, OnInit } from '@angular/core';
import { BPDataService } from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { CallStatus } from '../../../common/call-status';
import { BPEService } from '../../bpe.service';
import { DespatchLine } from '../../../catalogue/model/publish/despatch-line';

@Component({
    selector: "fulfilment",
    templateUrl: "./fulfilment.component.html",
    styleUrls: ["./fulfilment.component.css"]
})
export class FulfilmentComponent implements OnInit {

    line: CatalogueLine;
    // hjids of the line items included in the order
    orderLineItemHjids: string[] = null;
    // order line index of the selected product
    _selectedOrderLineIndex: number = 0;

    @Input() catalogueLines: CatalogueLine[] = [];

    constructor(private bpDataService: BPDataService,
        private bpeService: BPEService) {

    }

    totalDispatched: number[] = [];
    totalAccepted: number[] = [];
    totalToBeShipped: number[] = [];
    totalWaitingResponse: number[] = [];
    totalRejected: number[] = [];

    fulfilmentStatisticsCallStatus: CallStatus = new CallStatus();

    ngOnInit() {
        this.line = this.bpDataService.getCatalogueLine();

        this.initializeFulfilmentStatisticsSection();
    }

    showReceiptAdvice(): boolean {
        let isResponseSent = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.processStatus == 'Completed';
        let isCollaborationCancelled = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.collaborationStatus == "CANCELLED";
        return isResponseSent || (!!this.bpDataService.receiptAdvice && !isCollaborationCancelled);
    }

    private initializeFulfilmentStatisticsSection(): void {
        let orderId;
        let sellerFederationId;
        if (this.bpDataService.despatchAdvice) {
            orderId = this.bpDataService.despatchAdvice.orderReference[0].documentReference.id;
            sellerFederationId = this.bpDataService.despatchAdvice.despatchSupplierParty.party.federationInstanceID;
        }
        // starting a new Despatch Advice following a Transport Execution Plan
        else if (this.bpDataService.productOrder) {
            orderId = this.bpDataService.productOrder.id;
            sellerFederationId = this.bpDataService.productOrder.sellerSupplierParty.party.federationInstanceID;
        }
        // starting a new Despatch Advice following an Order
        else if (this.bpDataService.copyOrder) {
            orderId = this.bpDataService.copyOrder.id;
            sellerFederationId = this.bpDataService.copyOrder.sellerSupplierParty.party.federationInstanceID;
        }
        this.fulfilmentStatisticsCallStatus.submit();
        this.bpeService.getFulfilmentStatistics(orderId, sellerFederationId).then(result => {
            this.orderLineItemHjids = [];
            for (let statistics of result) {
                this.orderLineItemHjids.push(statistics.lineItemHjid.toString());
                let totalDispatched = statistics.dispatchedQuantity;
                let totalAccepted = statistics.acceptedQuantity;
                let totalRejected = statistics.rejectedQuantity;
                let waitingResponse = totalDispatched - totalAccepted - totalRejected;
                let toBeShipped = statistics.requestedQuantity - totalAccepted - waitingResponse;

                this.totalDispatched.push(totalDispatched);
                this.totalAccepted.push(totalAccepted);
                this.totalRejected.push(totalRejected);
                this.totalToBeShipped.push(toBeShipped > 0 ? toBeShipped : 0);
                this.totalWaitingResponse.push(waitingResponse);
            }

            this._selectedOrderLineIndex = this.getOrderLineIndex(0);

            this.fulfilmentStatisticsCallStatus.callback(null, true);
        }).catch(error => {
            this.fulfilmentStatisticsCallStatus.error("Failed to get fulfilment statistics", error);
        });
    }

    isLoading(): boolean {
        return this.fulfilmentStatisticsCallStatus.fb_submitted;
    }

    @Input()
    set selectedLineIndex(index: number) {
        this._selectedOrderLineIndex = this.getOrderLineIndex(index);
    }

    private getOrderLineIndex(index: number): number {
        let orderLineIndex: number = index;
        if (this.bpDataService.despatchAdvice && this.orderLineItemHjids) {
            let dispatchAdviceLine: DespatchLine = this.bpDataService.despatchAdvice.despatchLine[index];
            // In TEP view,we show all products included in the order at the top,however, TEP itself can contain a subset of these products as goods items,
            // therefore, we may not have a dispatch line for the given index.
            // in this case, we can simply return the given index, because it corresponds to the correct order line index
            if (dispatchAdviceLine) {
                let size = this.orderLineItemHjids.length;
                for (let i = 0; i < size; i++) {
                    if (this.orderLineItemHjids[i] == dispatchAdviceLine.orderLineReference.lineID) {
                        orderLineIndex = i;
                        break;
                    }
                }
            }
        }
        return orderLineIndex;
    }
}
