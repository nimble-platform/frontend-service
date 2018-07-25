import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { TransportationService } from "../model/publish/transportation-service";

@Component({
    selector: "transportation-service-input",
    templateUrl: "./transportation-service-input.component.html"
})
export class TransportationServiceInput implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: "edit" | "view" = "edit";

    constructor() {
    }

    ngOnInit() {
      if(this.catalogueLine.goodsItem.item.transportationServiceDetails == null) {
        this.catalogueLine.goodsItem.item.transportationServiceDetails = new TransportationService();
      }
    }
}
