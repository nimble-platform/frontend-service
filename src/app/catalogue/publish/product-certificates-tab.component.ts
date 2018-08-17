import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { Certificate } from "../model/publish/certificate";

@Component({
    selector: "product-certificates-tab",
    templateUrl: "./product-certificates-tab.component.html",
    styleUrls: ["./product-certificates-tab.component.css"]
})
export class ProductCertificatesTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    constructor() {
    }

    ngOnInit() {
        // nothing for now
    }

    onDelete(i: number) {
        this.catalogueLine.goodsItem.item.certificate.splice(i, 1);
    }

    onAddCertificate() {
        this.catalogueLine.goodsItem.item.certificate.push(new Certificate(""));
    }
}
