import { Component, OnInit } from '@angular/core';
import { FiltersService } from './filters.service';
import { Router } from '@angular/router';
import { Filter } from './model/filter';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'filters',
    templateUrl: './filters.component.html',
    styleUrls: ['./filters.component.css'],
    providers: [ FiltersService ]
})

export class FiltersComponent implements OnInit {
    filters: Filter[] = [];
    selections: number[] = [];
    private _selectionsSet: Set<number> = new Set();
    constructor(private service: FiltersService,
                private router: Router,
                private translate: TranslateService) {
                }

    ngOnInit() {
        // Get previously selected Filters and Selection Array
        const previousFilterSelections = sessionStorage.getItem('currentFilters');
        const previousSelectionsSet = sessionStorage.getItem('currentSelectionsSet');
        if ( previousFilterSelections !== null && previousSelectionsSet !== null ) {
            // if Previously interacted then use those values
            this.filters = JSON.parse(previousFilterSelections);
            this.selections = JSON.parse(previousSelectionsSet);
            this._selectionsSet = new Set<number>(this.selections);
        } else {
            // call the API
            this.showFilters();
        }
    }

    /**
     * API call to Filter Static JSON
     */
    showFilters() {
        this.service.getQuestions().then((data: any) => {
            this.filters = data.categories;
        });
    }

    /**
     * Add the Selection to a Set if checked/ Remove the Selection from a Set if unchecked
     * @param id number
     * @param event Event Trigger from HTML Input Element
     */
    changeCheck(id: number, event: any) {
        (event.target.checked) ? this._selectionsSet.add(id) : this._selectionsSet.delete(id);
        this.selections = Array.from(this._selectionsSet);
    }

    /**
     * Proceed to Step-2 : Factors
     * Store the present state of selected filters in sessionStorage
     */
    proceed() {
        // store the current filters to localStorage
        sessionStorage.setItem('currentFilters', JSON.stringify(this.filters));
        sessionStorage.setItem('currentSelectionsSet', JSON.stringify(this.selections));
        this.router.navigate(['qualiexplore/factors'], {queryParams: {ids: JSON.stringify(this.selections)}});

    }

    /**
     * Reset All Filters and previously stored Filters in `sessionStorage`
     */
    reset() {
        sessionStorage.clear();
        this.selections = [];
        this._selectionsSet.clear();
        this.showFilters();
    }
}
