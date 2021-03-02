import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {fromEvent} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@Component({
    selector: 'filter-search-input',
    templateUrl: './filter-search-input.component.html'
})
export class FilterSearchInputComponent implements AfterViewInit {

    @Input() values: string[];
    @Output() onValueChanged: EventEmitter<string[]> = new EventEmitter<string[]>();

    @ViewChild('searchText') searchTextRef;

    constructor() {
    }

    ngAfterViewInit() {
        if (this.searchTextRef) {
            fromEvent(this.searchTextRef.nativeElement, 'keyup')
                .pipe(
                    debounceTime(300),
                    distinctUntilChanged()
                )
                .subscribe(
                    () => this.onValueChanged.emit(this.searchValues(this.searchTextRef.nativeElement.value))
                );
        }
    }

    /**
     * Search for the given query in the filter values and returns the values including the query term
     * @param query
     */
    private searchValues(query: string): any[] {
        return this.values.filter(value => value.toString().toLowerCase().includes(query.toLowerCase()));
    }
}
