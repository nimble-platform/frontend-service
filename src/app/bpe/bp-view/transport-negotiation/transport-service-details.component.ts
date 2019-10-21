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

    // items which is shipped by this transport service
    goodsItems:GoodsItem[];

    selectPreferredValue=selectPreferredValue;
    constructor(private bpDataService: BPDataService,
        private translate: TranslateService) {
    }

    ngOnInit() {
        this.lineItem = this.rfq.requestForQuotationLine[0].lineItem;
        this.shipment = this.lineItem.delivery[0].shipment;
        this.goodsItems = copy(this.shipment.goodsItem);
        this.itemName = selectPreferredValue(this.shipment.goodsItem[0].item.name);
    }

    onProductSelection(checked,goodsItem:GoodsItem){
        // get goods item
        if(checked){
            this.shipment.goodsItem.push(goodsItem);
        }
        else {
            let goodsItemToBeRemoved:GoodsItem;
            for(let item of this.shipment.goodsItem){
                if(goodsItem.item.manufacturersItemIdentification.id == item.item.manufacturersItemIdentification.id && goodsItem.item.catalogueDocumentReference.id == item.item.catalogueDocumentReference.id){
                    goodsItemToBeRemoved = item;
                    break;
                }
            }
            let index = this.shipment.goodsItem.indexOf(goodsItemToBeRemoved);
            this.shipment.goodsItem.splice(index,1);
        }
    }
}
