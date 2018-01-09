import {Component, Input, ViewChild} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {FormControl, FormGroup, NgForm, Validators} from "@angular/forms";
/**
 * Created by suat on 24-Oct-17.
 */

@Component({
    selector: 'catalogue-line-header',
    templateUrl: './catalogue-line-header.component.html'
})

export class CatalogueLineHeaderComponent {
    @ViewChild('catalogueLineHeaderForm') public catalogueLineHeaderForm: NgForm;
    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;
    @Input() parentForm: FormGroup;

    productIdControl: FormControl = new FormControl(null, Validators.required);
    productNameControl: FormControl = new FormControl(null, Validators.required);
}