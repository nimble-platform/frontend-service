import { Component, Input } from "@angular/core";
import { CatalogueLine } from "./model/publish/catalogue-line";

@Component({
    selector: 'catalogue-line-view',
    templateUrl: './catalogue-line-view.component.html',
})

export class CatalogueLineViewComponent {

    @Input() line: CatalogueLine;

}
