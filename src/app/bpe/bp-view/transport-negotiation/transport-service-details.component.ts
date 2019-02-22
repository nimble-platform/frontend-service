import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Shipment } from "../../../catalogue/model/publish/shipment";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import {selectPreferredValue} from '../../../common/utils';

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

    constructor(private bpDataService: BPDataService) {
        
    }

    ngOnInit() {
        this.lineItem = this.rfq.requestForQuotationLine[0].lineItem;
        this.shipment = this.lineItem.delivery[0].shipment;

        this.itemName = selectPreferredValue(this.shipment.goodsItem[0].item.name);
    }
}
