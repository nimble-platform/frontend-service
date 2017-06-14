import { Component } from '@angular/core';
import { ExplorativeSearchService } from './explorative-search.service';
import { Explorative } from './model/explorative';

/* Array of storing responses */
export const OUTPUT: Explorative[] = [];


@Component({
    selector: 'explore-search-form',
    templateUrl: './explorative-search-form.component.html',
    styleUrls: ['./explorative-search-form.component.css'],
    providers: [ExplorativeSearchService]
})


export class ExplorativeSearchFormComponent {
    cbInput = false; // checkbox for every keyword in Search History
    Output = OUTPUT; // -- Use the stored data here in the details component --

    constructor(private expSearch: ExplorativeSearchService) {}

    Search(inputVal: string): void {
        inputVal = inputVal.trim();
        if (!inputVal) { return; }

        this.expSearch.searchData(inputVal)
                .then(res => {
                    this.Output.push(<Explorative> {kw: inputVal, resp: res});
                });
    }

    deleteKW(inputVal: string) {
        const index = this.Output.findIndex(op => op.kw === inputVal);
        if (index > -1) {
            this.Output.splice(index, 1);
        }
    }
    /*
    getValues(): Explorative[] {
        return this.Output;
    }*/
}
