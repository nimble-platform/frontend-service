import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ExplorativeSearchService} from './explorative-search.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

@Component({
    selector: 'explore-search-semantic',
    templateUrl: './explorative-search-semantic.component.html',
    styleUrls: ['./explorative-search-semantic.component.css'],
    providers: [ExplorativeSearchService]
})

export class ExplorativeSearchSemanticComponent implements OnInit, OnChanges {
    @Input() configSPQ: Object;
    @Input() lang: string;
    private objectRelationsButton = {};
    public sentence: string = '';
    public model: any;
    public selectedConcept: boolean = false;
    public selectedValue: boolean = false;
    public results: any[] = [];
    public searchvalue: string[] = [];
    public selectedPropertyURL: string;
    public valueResults: Object = {};
    public referenceResults: Object = {};
    public search = (text$: Observable<string>) =>
        text$
            .debounceTime(200)
            .map(term => term === '' ? []
                : this.results.filter(v => v.translatedProperty.toLowerCase()
                    .indexOf(term.toLowerCase()) > -1).slice(0, 10));
    public formatter = (x: {translatedProperty: string}) => x.translatedProperty;

    constructor(private expSearch: ExplorativeSearchService) {}


    ngOnChanges(): void {
        if (!this.configSPQ) { return; }
        // console.log(this.configSPQ); // DEBUG_CHECK
    }

    ngOnInit(): void {
        let dummyJSON = this.configSPQ;
        this.expSearch.getSQPButton(dummyJSON)
            .then(res => this.objectRelationsButton = res);
        this.sentence = this.configSPQ['frozenConcept'];
    }
    hasPropertyRelation(inputVal: string) {
       this.sentence += ' <' + inputVal + '> ';
        this.expSearch.searchForProperty(this.configSPQ)
            .then(res => {
                    // console.log(res);
                    this.results = res;
                }
            );
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
        let dummyJSON = {'conceptURL': this.configSPQ['concept'], 'language': this.configSPQ['language']};
        this.expSearch.getReferencesFromConcept(dummyJSON)
            .then(res => {
                // console.log(res);
                this.referenceResults = res;
                console.log(this.referenceResults);
                this.sentence += this.referenceResults['allAvailableReferences'][0].translatedProperty;
            });
    }

    objectPropRelation(inputVal: string) {
        this.sentence += ' <' + inputVal + '> ';
    }

}
