/**
 * Filter Functionality on Clicking A Node.
 * This component handles the filter panel that appears
 * after a node on the Diagram is clicked.
 * Parent Component for this class: explorative-search-details.component
 * Child Component for this class: none
 */

import {Component, Input, OnChanges, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import {ExplorativeSearchService} from './explorative-search.service';

@Component({
    selector: 'search-filter',
    templateUrl: './explorative-search-filter.component.html',
    styleUrls: ['./explorative-search-filter.component.css'],
    providers: [ExplorativeSearchService]
})

export class ExplorativeSearchFilterComponent implements OnChanges {
    /*variables for values coming from Parent Component `search-details`*/
    /*@Input() mainConceptName: string;
    @Input() mainConceptUrl: string;
    @Input() filterConfig: Object;
    @Input() keyForConf: string;
    @Input() filterName: string;
    */
    @Input() filterProperties: Object;
    @Output() filterSelectionUpdated = new EventEmitter();

    /*Final Data to be sent back to parent for processing.. Maybe..*/
    finalSelectionJSON: Object;
    /*for storing array from JSON response for checkboxes*/
    result: any[] = [];
    /*Collection of User selections..*/
    userSelections: any[] = [];
    /*Component where the slider value is shown everytime the value changes*/
    @ViewChild('rangeVal') slider: ElementRef;
    private  _error_detected_slider;

    constructor(private expSearch: ExplorativeSearchService) {}

    /**
     * use the OnChanges LifeCycle Hook for everytime when the parent sends
     * a new filter configuration to the child
     */
    ngOnChanges(): void {
        // console.log('FilterConfig ', this.filterProperties['filterJSON']); // DEBUG Check
        this.result = [];
        this.finalSelectionJSON = {'root': this.filterProperties['fQueryRootUrl'], 'filter': []};
        if (this.filterProperties['filterJSON'] === {}) {
            this.userSelections = [];
        }
        for (let keyConfig in this.filterProperties['filterJSON']) {
            if (this.filterProperties['filterJSON'].hasOwnProperty(keyConfig)) {
                // store the JSON array in the result array for display
                this.result = this.filterProperties['filterJSON'][keyConfig];
                // console.log(this.result); // DEBUG
            }
        }
    }

    /**
     * checkedValues: function is triggered when the Checkboxes are checked
     * @param inp checkBox value (check HTML code for [value] attribute
     * @param status if the checkbox value is checked or not..
     */
    checkedValues(inp: any, status: boolean) {
        // if the value does not exist and the checkbox is checked.
        // insert in the userSelection array
        if (this.userSelections.indexOf(inp) === -1 && status) {
            for (let eachResult of this.result) {
                if (eachResult['description'] === inp) {
                    // NEED TO WORK HERE.. Must be a Array of JSON according to API input
                    // let tempArr: any[] = [];
                    // tempArr.push({'property': this.keyForConf, 'values': [eachResult['min'], eachResult['max']]});
                    this.userSelections.push({'property': this.filterProperties['fQuery'],
                        'values': [eachResult['min'], eachResult['max']]
                    });
                }
            }
        } else if (!status) { // if the checkbox is unchecked remove from array
            let index = this.userSelections.indexOf(inp);
            this.userSelections.splice(index, 1);
        }
        // console.log('Filter Area: ', this.userSelections); // DEBUG CHECK
        if (this.userSelections.length > 0) {
            this.finalSelectionJSON = {'root': this.filterProperties['fQueryRoot'], 'filter': this.userSelections};
        } else {
            // console.log('FilterArea: this.userSelections', this.userSelections);
            this.finalSelectionJSON = {'root': this.filterProperties['fQueryRoot'],
                'child': this.filterProperties['fQuery'], 'filter': []};
        }
    }

    /**
     * getGroupVal: function handles the change in the slider values
     * With increase or decrease of the slider value
     * the `amountOfGroups` parameter of JSON changes and calls to the backend
     * are made.
     * @param eventValue: Event from the Slider
     */

    getGroupVal(eventValue: number) {
        // change the HTML display everytime the slider value changes
        this.slider.nativeElement.innerHTML = eventValue;
        // console.log(eventValue); DEBUG
        // Create a JSON for the Filter and `amountOfGroups` should be changed
        // according to the slider values.
        for (let key in this.filterProperties['filterJSON']) {
            if (this.filterProperties['filterJSON'].hasOwnProperty(key)) {
                this.filterProperties['fQuery'] = key;
            }
        }
        let filteringInput = {'concept': encodeURIComponent(this.filterProperties['fQueryRoot'].trim()),
            'property': encodeURIComponent(this.filterProperties['fQuery'].trim()),
            'amountOfGroups': eventValue};
        // Call API everytime the slider value changes.
        this.expSearch.getPropertyValues(filteringInput)
            .then(res => {
                this.result = res[this.filterProperties['fQuery']]; // store the array in JSON response in the result array
                this._error_detected_slider = false;
            })
            .catch(error => {
                //console.log(error);
                this._error_detected_slider = true;
            });
    }

    /**
     * This function should give back the Parent Component the user's selection
     * of filter choices.
     * Try Output & EventEmitter here `maybe` to send back data to Parent (search-details.component)
     */
    submitFilter(): void {
        // console.log(Number(this.groupSelectVal)); DEBUG
        // This needs to be changed according to Backend API
        this.filterSelectionUpdated.emit(this.finalSelectionJSON);
        //console.log('FilterArea: finalSelectionJSON', this.finalSelectionJSON); // DEBUG CHECK
    }
}
