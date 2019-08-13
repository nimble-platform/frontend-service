import { Component, OnInit } from '@angular/core';
import { FiltersService } from './filters.service';
import { Router } from '@angular/router';
import { Filter } from './model/filter';

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
    constructor(private service: FiltersService, private router: Router) {}

    ngOnInit() {
        this.showFilters();
    }

    showFilters() {
        this.service.getQuestions().then((data: any) => {
            this.filters = data.categories;
        });
    }

    changeCheck(id: number, event: any) {
        (event.target.checked) ? this._selectionsSet.add(id) : this._selectionsSet.delete(id);
        this.selections = Array.from(this._selectionsSet);
    }

    proceed() {
        this.router.navigate(['qualiexplore/factors'], {queryParams: {ids: JSON.stringify(this.selections)}});

    }
}
