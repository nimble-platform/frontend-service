import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Shipment } from "../../../catalogue/model/publish/shipment";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import {copy, selectPreferredValue} from '../../../common/utils';
import {TranslateService} from '@ngx-translate/core';
import {GoodsItem} from '../../../catalogue/model/publish/goods-item';

@Component({
    selector: "transport-service-details",
    templateUrl: "./transport-service-details.component.html"
})
export class TransportServiceDetailsComponent implements OnInit {

    @Input() rfq: RequestForQuotation;
    @Input() disabled: boolean;

    lineItem: LineItem;
    shipment: Shipment;
    itemName:string;

    // items which are shipped by this transport service
    goodsItems:GoodsItem[];
    selectedProducts:boolean[];

    selectPreferredValue=selectPreferredValue;
    constructor(private bpDataService: BPDataService,
        private translate: TranslateService) {
    }

    ngOnInit() {
        this.lineItem = this.rfq.requestForQuotationLine[0].lineItem;
        this.shipment = this.lineItem.delivery[0].shipment;
        this.goodsItems = copy(this.shipment.goodsItem);
        this.itemName = selectPreferredValue(this.shipment.goodsItem[0].item.name);
        this.selectedProducts = [];
        // populate selectedProducts array and set the sequence number of each goods item
        let size = this.goodsItems.length;
        for(let i = 0; i < size ; i++){
            this.goodsItems[i].sequenceNumberID = i.toString();
            this.selectedProducts.push(true);
        }
    }

    getSelectedProductsToShip(){
        let goodsItemsToShip:GoodsItem[] = [];
        let size = this.selectedProducts.length;
        for(let i = 0; i < size;i++){
            if(this.selectedProducts[i]){
                goodsItemsToShip.push(this.goodsItems[i]);
            }
        }
        return goodsItemsToShip;
    }
}
