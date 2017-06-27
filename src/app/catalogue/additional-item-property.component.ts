/**
 * Created by suat on 18-May-17.
 */
import {Component, Input, OnInit} from "@angular/core";
import {AdditionalItemProperty} from "./model/publish/additional-item-property";

@Component({
    selector: 'additional-item-property',
    templateUrl: './additional-item-property.component.html'
})

export class AdditionalItemPropertyComponent implements OnInit {
    @Input() additionalItemProperty:AdditionalItemProperty;

    stringValue:boolean = true;
    binaryValue:boolean = false;

    ngOnInit(): void {
        if(this.additionalItemProperty.embeddedDocumentBinaryObject.length != 0) {
            this.stringValue = false;
            this.binaryValue = true;
        }
    }
}