import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import {ExplorativeSearchService} from './explorative-search.service';
import { Observable } from 'rxjs/Observable';
import { NgbAccordionConfig } from '@ng-bootstrap/ng-bootstrap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

@Component({
    selector: 'explore-search-semantic',
    templateUrl: './explorative-search-semantic.component.html',
    styleUrls: ['./explorative-search-semantic.component.css'],
    providers: [ExplorativeSearchService, NgbAccordionConfig]
})

export class ExplorativeSearchSemanticComponent implements OnChanges, OnInit {
    // Components from the Parent Component
    @Input() configSPQ: Object;
    @Input() lang: string;
    // store the incoming JSON for Further Purposes.
    private _propertyGetterJSON: Object = {};
    private _mainConceptName = '';
    // Orange Button from BackendAPI
    private objectRelationsButton = {};
    private _optSelectJSON = {};
    public sparqlSelectedOption = {};
    public objRelationOutputJSON = {};
    @ViewChild('acc') acc;
    // reference JSON
    private _referenceJSON: Object = {};
    public negotiationEnable: boolean = false;
    private _negotiation_id: any;
    private _negotation_catalogue_id: any;
    public hiddenElement: boolean = false;
    public sentence: string = '';
    public model: any;
    public selectedValue: boolean = false;
    public selectedReference: boolean = false;
    public results: any[] = [];
    public searchvalue: string[] = [];
    public selectedPropertyURL: string;
    public valueResults: Object = {};
    public referenceResults: Object = {};
    public sparqlJSON: Object = {};
    public tableResult: any;
    public refResultsRange: any[] = [];
    public search = (text$: Observable<string>) =>
        text$
            .debounceTime(200)
            .map(term => term === '' ? []
                : this.results.filter(v => v.translatedProperty.toLowerCase()
                    .indexOf(term.toLowerCase()) > -1).slice(0, 10));
    public formatter = (x: {translatedProperty: string}) => x.translatedProperty;


    constructor(private expSearch: ExplorativeSearchService, private router: Router, private accConfig: NgbAccordionConfig) {
        accConfig.closeOthers = true;
    }
    ngOnChanges(): void {
        if (!this.configSPQ) { return; }
        this._mainConceptName = this.configSPQ['concept'];
        // console.log(this.configSPQ); // DEBUG_CHECK
        this._propertyGetterJSON = this.configSPQ;
        // console.log(this._propertyGetterJSON);
        // get the button
        this.expSearch.getSQPButton(this.configSPQ)
            .then(res => this.objectRelationsButton = res);
        this.sentence = this.configSPQ['frozenConcept'];
        this.tableResult = {};
        this.selectedPropertyURL = '';
        this.sparqlJSON = {};
        this.sparqlJSON['parametersIncludingPath'] = [];
        this.sparqlJSON['parameters'] = [];
        this.sparqlJSON['filters'] = [];
        this.sparqlJSON['orangeCommandSelected'] = {names: []};
        this.referenceResults = {};
        this.refResultsRange = [];
    }

    ngOnInit(): void {
        this.sparqlJSON['parametersIncludingPath'] = [];
        this.sparqlJSON['parameters'] = [];
        this.sparqlJSON['filters'] = [];
        this.sparqlJSON['orangeCommandSelected'] = {name: ''};
    }

    /**
     * hasPropertyRelation: use to determine if the main/reference concept has properties.
     * triggered when hasProperty button is clicked
     *
     */

    hasPropertyRelation() {
       // console.log('hasPropertyRelation', this._propertyGetterJSON);
        if (!this.selectedReference) {
            this._propertyGetterJSON['concept'] = this._mainConceptName;
        }
        this.expSearch.searchForProperty(this._propertyGetterJSON)
            .then(res => {
                    // console.log(res);
                    this.results = res;
                }
            );
    }


    applyProperty() {
        this.selectedPropertyURL = this.model.propertyURL;
        this.sentence += ' <hasProperty> ' + this.model.translatedProperty;
        if (this.selectedReference) {
            this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL));
            this.sparqlJSON['parametersIncludingPath'].push(
            {'urlOfProperty': encodeURIComponent(this.model.propertyURL),
                'path': [{'concept': this._mainConceptName},
                    {'urlOfProperty': encodeURIComponent(this._referenceJSON['objectPropertyURL']),
                        'concept': encodeURIComponent(this._referenceJSON['range'][0]['original'])
                    }]
            });
            this.selectedReference = false;
        }else {
            this.applyURL(this.selectedPropertyURL);
        }
    }



    hasValueRelation(inputVal: string) {
        this.selectedValue = false;
        let temp: any[] = [];
        this.sentence += ' <' + inputVal + '> ';
        // console.log('hasValueRelation ', this.configSPQ);
        console.log(this.selectedPropertyURL);
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
        this.selectedReference = false;
        // console.log('hasReferenceRelation', this.configSPQ);
        let dummyJSON = {'conceptURL': this.configSPQ['concept'], 'language': this.configSPQ['language']};
        this.expSearch.getReferencesFromConcept(dummyJSON)
            .then(res => {
                // console.log(res);
                this.referenceResults = res;
                // console.log(this.referenceResults);
                // this.sentence += this.referenceResults['allAvailableReferences'][0].translatedProperty;
                // this.refResultsRange = this.referenceResults['allAvailableReferences'][0].range;
            });

    }

    showRefResults(index: number) {
        this.refResultsRange = this.referenceResults['allAvailableReferences'][index].range;
        // console.log('showRefResults', this.referenceResults['allAvailableReferences'][index]);
        this._referenceJSON = this.referenceResults['allAvailableReferences'][index];
    }

    referenceSelection(ref: any): void {
        this.selectedReference = true;
        this.sentence += ' <hasReference> ';
        this.sentence = this.sentence + ref.translation;
        this.selectedPropertyURL = ref.original;
        // console.log(this._propertyGetterJSON);
        this._propertyGetterJSON['concept'] = encodeURIComponent(this.selectedPropertyURL);
        this._propertyGetterJSON['distanceToFrozenConcept'] += 1;
    }

    objectPropRelation(inputVal: string) {
        let orangeJSON = {conceptURL: this.configSPQ['concept'], orangeCommand: inputVal};
        this.sentence += ' <' + inputVal + '> ';
        this.sparqlJSON['orangeCommandSelected']['names'].push(inputVal);
        // console.log(orangeJSON);
        // call API
        this.expSearch.getPropertyValuesFromOrangeGroup(orangeJSON)
            .then(res => {
                this.objRelationOutputJSON = res;
                console.log(this.objRelationOutputJSON);
                this.selectedValue = false;
                this.searchvalue = this.objRelationOutputJSON['allValues'];
                this.acc.toggle('toggle-value');
            });
    }

    genTable(): void {
        // this.sparqlJSON['parametersIncludingPath'].push({'urlOfProperty': encodeURIComponent(this.selectedPropertyURL),
        // 'path': [{'concept': this.configSPQ['concept']}]});
        // console.log('genTable' + this.configSPQ);
        this.sparqlJSON['concept'] = this._mainConceptName;
        // this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL));

        // this.sparqlJSON['filters'].push({'property': encodeURIComponent(this.selectedPropertyURL), 'min': Number(this.Value),
        //     'max': Number(this.Value) + 1});
        this.sparqlJSON['language'] = this.configSPQ['language'];
        this.expSearch.getTableValues(this.sparqlJSON)
            .then(res => {
                this.tableResult = res;
            });
    }

    applyURL(url: string): void {
        // this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL));
        // console.log(url);
        // this.sparqlJSON['parameters'].push(encodeURIComponent(url));
        this.sparqlJSON['parameters'].push(url.split('#')[1]);
        this.sparqlJSON['parametersURL'] = [];
        // this.sparqlJSON['parametersIncludingPath'].push({'urlOfProperty': encodeURIComponent(this.selectedPropertyURL),
        //     'path': [{'concept': this.configSPQ['concept']}]});
        // console.log('applyURL', this.configSPQ);
        this.sparqlJSON['parametersIncludingPath'].push({'urlOfProperty': encodeURIComponent(url),
                'path': [{'concept': this.configSPQ['concept']}]});
    }

    applyFilter(val: string, url: string) {
        // this.sparqlJSON['filters'].push({'property': encodeURIComponent(this.selectedPropertyURL), 'min': Number(this.Value),
        //     'max': Number(this.Value) + 1});
        console.log(val, url);
        if (url.split('#')[1] !== val) { // this check is critical because when an orange button is clicked,
            // the previous value of the url is still existing.
           console.log('orange button was pressed');
        } else {
            this.sparqlJSON['filters'].push({'property': encodeURIComponent(url), 'min': Number(val),
                'max': Number(val) + 1});
        }
    }

    getSparqlOptionalSelect(indexInp: number) {
        // console.log(indexInp);
        // need URI component in order to send url as JSON.stringify
        this._optSelectJSON = {'uuid': encodeURIComponent(this.tableResult.uuids[indexInp].trim())};
        this._optSelectJSON['language'] = this.lang;
        // console.log(this._optSelectJSON);
        this.expSearch.getOptionalSelect(this._optSelectJSON)
            .then(res => {
                this.sparqlSelectedOption = res;
                // this._error_detected_getSPARQLSelect = false;
                if (this.sparqlSelectedOption['columns'].findIndex(i => i === 'id') >= 0 &&
                    this.sparqlSelectedOption['columns'].findIndex(j => j === 'catalogueId') >= 0) {
                    console.log('Negotiation can exist');
                    this.negotiationEnable = true;
                    let index_id = this.sparqlSelectedOption['columns'].findIndex(i => i === 'id');
                    let index_catalogue = this.sparqlSelectedOption['columns'].findIndex(i => i === 'catalogueId');
                    this._negotiation_id = this.sparqlSelectedOption['rows'][0][index_id];
                    this._negotation_catalogue_id = this.sparqlSelectedOption['rows'][0][index_catalogue];
                } else {
                    this.negotiationEnable = false;
                }
            })
            .catch(error => {
                console.log(error);
                // this._error_detected_getSPARQLSelect = true;
            });

        this.hiddenElement = true;
    }

    negotiation(): void {
        // console.log(this._negotation_catalogue_id, this._negotiation_id);
        // console.log(`/simple-search-details?catalogueId=${this._negotation_catalogue_id}&id=${this._negotiation_id}`);
        this.router.navigate(['/simple-search-details'],
            { queryParams: {catalogueId: this._negotation_catalogue_id, id: this._negotiation_id} });
    }
}
