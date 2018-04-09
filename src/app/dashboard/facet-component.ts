import {Component, EventEmitter, Input, Output} from "@angular/core";
/**
 * Created by suat on 28-Mar-18.
 */


@Component({
    selector: 'facet',
    templateUrl: './facet-component.html',
    styleUrls: ['./facet.component.css']
})
export class FacetComponent {
    @Input() title: string;
    @Input() dataType: string = 'string'; // currently supports boolean and string
    @Input() booleanValue: boolean = false;
    @Input() stringValues: string[] = [];
    @Input() selectedStringValues: string[] = [];
    @Input() filterActive: boolean = false; // true means user already selected a value for this facet, in this case we check the checkboxes

    @Output() booleanValueChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() triggerCriteriaChanged: EventEmitter<void> = new EventEmitter<void>();

    selectStringValue(value: string): void {
        let index = this.selectedStringValues.indexOf(value);
        if(index == -1) {
            this.selectedStringValues.push(value);
        } else {
            this.selectedStringValues.splice(index, 1);
        }
    }
}