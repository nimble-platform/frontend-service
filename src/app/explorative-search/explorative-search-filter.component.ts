/**
 * Created by des on 09.07.2017.
 * Filter Functionality on Clicking A Node.
 */

import {Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';

@Component({
    selector: 'search-filter',
    templateUrl: './explorative-search-filter.component.html',
    styleUrls: ['./explorative-search-filter.component.css'],
})

export class ExplorativeSearchFilterComponent implements OnChanges {
    @Input() filterConfig: Object;
    @Input() keyForConf: string;
    result: any[] = [];
    cbCheck = false;
    userSelections: any[] = [];
    @ViewChild('rangeVal') slider: ElementRef;
    groupSelectVal: number = 3;
    constructor() {}
    ngOnChanges(): void {

        for (let keyConfig in this.filterConfig) {
            if (this.filterConfig[keyConfig]) {
                this.result = this.filterConfig[keyConfig];
                // console.log(this.result);
            }
        }
    }
    checkedValues(inp: any, status: boolean) {
        console.log(inp + 'selected');
        if (this.userSelections.indexOf(inp) === -1 && status) {
            this.userSelections.push(inp);
        } else if (!status) {
            let index = this.userSelections.indexOf(inp);
            this.userSelections.splice(index, 1);
        }
        // console.log(this.userSelections);
    }

    getGroupVal(inpVal: any) {
        this.slider.nativeElement.innerHTML = inpVal;
        this.groupSelectVal = inpVal;
        // console.log(this.groupSelectVal);
    }

    submitFilter(): void {
        console.log('Submitting: ', this.userSelections, this.groupSelectVal);
    }
}
