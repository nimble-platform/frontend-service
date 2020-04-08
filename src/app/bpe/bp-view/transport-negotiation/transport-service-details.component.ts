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

import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Shipment } from "../../../catalogue/model/publish/shipment";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import { copy, selectPreferredValue } from '../../../common/utils';
import { TranslateService } from '@ngx-translate/core';
import { GoodsItem } from '../../../catalogue/model/publish/goods-item';
import { Text } from '../../../catalogue/model/publish/text';

@Component({
    selector: "transport-service-details",
    templateUrl: "./transport-service-details.component.html"
})
export class TransportServiceDetailsComponent implements OnInit {

    @Input() rfq: RequestForQuotation;
    @Input() quotationShipment: Shipment = null;
    @Input() disabled: boolean;
    // TODO: need a better way to handle notes and files section in Transport service details
    @Input() disableQuotationNotesSection: boolean;

    lineItem: LineItem;
    shipment: Shipment;

    // items which are shipped by this transport service
    goodsItems: GoodsItem[];

    selectPreferredValue = selectPreferredValue;

    disableAddProductButton: boolean = false;
    constructor(private bpDataService: BPDataService,
        private translate: TranslateService) {
    }

    ngOnInit() {
        if (this.bpDataService.productOrder) {
            this.disableAddProductButton = true;
        }
        this.lineItem = this.rfq.requestForQuotationLine[0].lineItem;
        this.shipment = this.lineItem.delivery[0].shipment;
        // each item in the shipment should have a name
        if (this.shipment.goodsItem[0].item.name == null || this.shipment.goodsItem[0].item.name.length == 0) {
            this.shipment.goodsItem[0].item.name = [new Text()]
        }
        this.goodsItems = this.shipment.goodsItem;
        // populate selectedProducts array and set the sequence number of each goods item
        let size = this.goodsItems.length;
        for (let i = 0; i < size; i++) {
            this.goodsItems[i].sequenceNumberID = i.toString();
        }
    }

    addGoodsItemToBeShipped() {
        let goodsItem: GoodsItem = new GoodsItem();
        goodsItem.item.name = [new Text()];
        this.goodsItems.push(goodsItem);
    }

    deleteGoodsItem(index: number) {
        this.goodsItems.splice(index, 1);
    }

    onGrossVolumeAndWeightUpdated(type: string) {
        if (type == 'volume') {
            this.shipment.consignment[0].grossVolumeMeasure.value = 0;
            this.goodsItems.forEach(goodsItem => this.shipment.consignment[0].grossVolumeMeasure.value += goodsItem.grossVolumeMeasure.value);
        }
        else {
            this.shipment.consignment[0].grossWeightMeasure.value = 0;
            this.goodsItems.forEach(goodsItem => this.shipment.consignment[0].grossWeightMeasure.value += goodsItem.grossWeightMeasure.value);
        }
    }

    onGrossVolumeAndWeightUnitUpdated(type: string, unit: string) {
        if (type == 'volume') {
            this.goodsItems.forEach(goodsItem => goodsItem.grossVolumeMeasure.unitCode = unit);
            this.shipment.consignment[0].grossVolumeMeasure.unitCode = unit;
        }
        else {
            this.goodsItems.forEach(goodsItem => goodsItem.grossWeightMeasure.unitCode = unit);
            this.shipment.consignment[0].grossWeightMeasure.unitCode = unit;
        }
    }

    isNoteSectionDisabled() {
        if (this.disableQuotationNotesSection != undefined) {
            return this.disableQuotationNotesSection;
        }
        return this.disabled;
    }
}
