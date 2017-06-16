/**
 * This file takes care of the Search button and delete Button
 * Search button: upon clicking the keyword response is fetched
 * from server and displayed on the HTML page.
 * 
 * Delete button: appears once the checkbox beside the keyword is checked
 * upon clicking it the content and the keyword itself are removed from 
 * the HTML file
 */
import { Component } from '@angular/core';
import { ExplorativeSearchService } from './explorative-search.service';
import { Explorative } from './model/explorative';

/**
 * Array for storing incoming HTTP responses
 * FORMAT: [{keyword: val1, response: someResponse1},
 *  {keyword: val2, response: someResponse2} ..
 * ]
 * A JSON list of searched Keywords and their respective responses
 */
export const OUTPUT: Explorative[] = [];


@Component({
    selector: 'explore-search-form',
    templateUrl: './explorative-search-form.component.html',
    styleUrls: ['./explorative-search-form.component.css'],
    providers: [ExplorativeSearchService]
})


export class ExplorativeSearchFormComponent {

    // checkbox for every keyword in Search History
    // remember: the variable name is same as in the HTML file
    cbInput = false;
    // Use the stored data which might further
    // data visualization
    // remember: the variable `Output` is the same as in the HTML file
    Output = OUTPUT;

    constructor(private expSearch: ExplorativeSearchService) {}

    /**
     * Search: will get a HTTP response from the server (HTTP GET)
     *          of the keyword which user inputs.
     * @param inputVal string obtained from the input bar of the HTML file
     */
    Search(inputVal: string): void {
        inputVal = inputVal.trim(); // trim whitespaces
        if (!inputVal) { return; } // if no input; do nothing

        // Let the Service do its fetching of data from server
        this.expSearch.searchData(inputVal)
                .then(res => {
                    // push the data in to List
                    this.Output.push(<Explorative> {kw: inputVal, resp: res});
                });
    }

    /**
     * deleteKW: if the checkbox(cbInput) is checked then the delete button
     * will appear. On clicking the delete button remove the data from the
     * Output List.
     * @param inputVal string of the selected keyword to be removed
     */
    deleteKW(inputVal: string) {
        // find the matching keyword in the List Output
        const index = this.Output.findIndex(op => op.kw === inputVal);
        if (index > -1) {
            // remove the whole entry from the list
            this.Output.splice(index, 1);
        }
    }
}
