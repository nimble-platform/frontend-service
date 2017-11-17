import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ExplorativeSearchService} from './explorative-search.service';
import { Observable } from 'rxjs/Observable';
import { SearchItem } from './model/SearchItem';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import {FormControl} from '@angular/forms';

@Component({
    selector: 'explore-search-semantic',
    templateUrl: './explorative-search-semantic.component.html',
    styleUrls: ['./explorative-search-semantic.component.css'],
    providers: [ExplorativeSearchService]
})

export class ExplorativeSearchSemanticComponent implements OnInit, OnChanges {

    private loading: boolean = false;
    private objectRelationsButton = {};
    public sentence: any;
    private results: Observable<SearchItem[]>;
    public searchvalue: string[] = [];
    public selectedPropertyURL: string;
    public valueResults: Object = {};
    private searchField: FormControl;
    selected: boolean = false;
    @Input() configSPQ: Object;
    @Input() lang: string;
    constructor(private expSearch: ExplorativeSearchService) {}


    ngOnChanges(): void {
        if (!this.configSPQ) { return; }
        // console.log(this.configSPQ); // DEBUG_CHECK
    }

    ngOnInit(): void {
        this.searchField = new FormControl();
        let dummyJSON = this.configSPQ;
        this.expSearch.getSQPButton(dummyJSON)
            .then(res => this.objectRelationsButton = res);
        this.sentence = this.configSPQ['frozenConcept'];
    }
    hasPropertyRelation(inputVal: string) {
       this.sentence += ' <' + inputVal + '> ';
        this.results = this.searchField.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .do( () => this.loading = true)
            .switchMap(term => {
                if (term) {
                    return this.expSearch.searchForProperty(this.configSPQ);
                }
                })
            .do( () => this.loading = false);
    }



    hasValueRelation(inputVal: string) {
        let temp: any[] = [];
        this.sentence += ' <' + inputVal + '> ';
        let dummyJSON = {'conceptURL': this.configSPQ['concept'],
            'propertyURL': encodeURIComponent(this.selectedPropertyURL)};
        this.expSearch.searchForPropertyValues(dummyJSON)
            .then(res => {
                this.valueResults = res;
                temp = this.valueResults['allValues'];
                this.searchvalue = temp.map( (v) => {
                    return v.split('^')[0];
                });
            });
    }

    hasReferenceRelation(inputVal: string) {
        this.sentence += ' <' + inputVal + '> ';
    }

    objectPropRelation(inputVal: string) {
        this.sentence += ' <' + inputVal + '> ';
    }

}
