import {Component, Input, OnChanges, OnInit, ViewChild, TemplateRef} from '@angular/core';
import { Router } from '@angular/router';
import {ExplorativeSearchService} from './explorative-search.service';
import { Observable } from 'rxjs/Observable';
import {NgbAccordionConfig, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

/*Modal Component where the User can Edit their query*/
@Component({
    selector: 'ngbd-modal-content',
    template: `
    <div class="modal-header">
      <h4 class="modal-title">Edit your Semantic Query</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
        Available Keywords that can be Removed:
        <p *ngIf="modalKeys.length === 1"><b> No Semantic Query Created ! </b></p>
      <ul *ngIf="modalKeys.length > 1">
          <li *ngFor="let eachKey of modalKeys; let i=index;">
              <div>
                <span><code>{{eachKey}}</code></span> <button class="btn-xs btn-danger" 
                                                              *ngIf="i > 0" (click)="removeQParam(eachKey,i);">&times;</button>
              </div>
          </li>
      </ul>
    </div>
  `
})

export class NgbdModalContent {
    @Input() modalKeys: string[] = [];
    constructor(public activeModal: NgbActiveModal) {}
    removeQParam(keyword: string, clickedIndex: number) {
        // console.log(this.modalKeys[clickedIndex + 1]);
        if (Number(this.modalKeys[clickedIndex + 1]) > 0) {
            this.activeModal.close({toRemove: keyword, filterValue: this.modalKeys[clickedIndex + 1]});
        }
        this.activeModal.close({toRemove: keyword, filterValue: null});
        this.modalKeys.splice(clickedIndex + 1, 1);
        this.modalKeys.splice(clickedIndex, 1);
    }

}

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
    public whereAreYou = '';
    // Orange Button from BackendAPI
    private objectRelationsButton = {};
    private _optSelectJSON = {};
    public sparqlSelectedOption = {};
    public objRelationOutputJSON = {};
    @ViewChild('acc') acc;
    @ViewChild('content') modalContent: TemplateRef<void>;
    /*Create a Responsive JSON structure for Semantic Query*/
    public semQJSon: Object = {};
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



    constructor(private expSearch: ExplorativeSearchService, private router: Router,
                private accConfig: NgbAccordionConfig, private modal: NgbModal) {
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
        this.semQJSon = {};
        this.semQJSon['keyword'] = {value: this.configSPQ['frozenConcept'], type: 'main'};
        this.tableResult = {};
        this.selectedPropertyURL = '';
        this.sparqlJSON = {};
        this.sparqlJSON['parametersIncludingPath'] = [];
        this.sparqlJSON['parameters'] = [];
        this.sparqlJSON['filters'] = [];
        this.sparqlJSON['orangeCommandSelected'] = {names: []};
        this.referenceResults = {};
        this.refResultsRange = [];
        if (this.acc.activeIds.length) {
            this.acc.activeIds.forEach(openPanel => {
                // console.log(openPanel);
                this.acc.toggle(openPanel);
            });
        }
        this.results = [];
        this.whereAreYou = this.configSPQ['frozenConcept'];
    }

    ngOnInit(): void {
        this.sparqlJSON['parametersIncludingPath'] = [];
        this.sparqlJSON['parameters'] = [];
        this.sparqlJSON['filters'] = [];
        this.sparqlJSON['orangeCommandSelected'] = {name: ''};
        this.accConfig.closeOthers = true;
        this.semQJSon = {};
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
            this.whereAreYou = this.configSPQ['frozenConcept'];
        }
        this.expSearch.searchForProperty(this._propertyGetterJSON)
            .then((res) => {
                // console.log(res); // DEBUG
                this.results = [];
                res.filter(value => {
                    // filter out only datatype properties
                        if (value.datatypeProperty) {
                            this.results.push(value);
                        }
                    });
                }
            );
    }


    applyProperty() {
        this.selectedPropertyURL = this.model.propertyURL;
        let selectedPropName = this.model.translatedProperty;
        let insertedPart = ' <hasProperty> ' + this.model.translatedProperty;
        this.sentence += ' <hasProperty> ' + this.model.translatedProperty;
        if (this.selectedReference) {
            this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL.split('#')[1]));
            this.sparqlJSON['parametersIncludingPath'].push(
            {'urlOfProperty': encodeURIComponent(this.model.propertyURL),
                'path': [{'concept': this._mainConceptName},
                    {'urlOfProperty': encodeURIComponent(this._referenceJSON['objectPropertyURL']),
                        'concept': encodeURIComponent(this._referenceJSON['range'][0]['original'])
                    }]
            });

            for (let semQKeys in this.semQJSon) {
                if (this.semQJSon.hasOwnProperty(semQKeys)) {
                    if (this.semQJSon[semQKeys]['type'] === 'objprop') {
                        this.semQJSon[semQKeys][this.model.translatedProperty] = {value: insertedPart, type: 'dataprop'};
                    }
                }
            }
            this.selectedReference = false;
        }else {
            this.applyURL(this.selectedPropertyURL);
            this.semQJSon[selectedPropName] = {value: insertedPart, type: 'dataprop'};
        }
    }



    hasValueRelation(inputVal: string) {
        this.selectedValue = false;
        let temp: any[] = [];
        this.sentence += ' <' + inputVal + '> ';
        // console.log('hasValueRelation ', this.configSPQ);
        // console.log(this.selectedPropertyURL);
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
        this.whereAreYou = ref.translation;
        // console.log(this._propertyGetterJSON);
        this._propertyGetterJSON['concept'] = encodeURIComponent(this.selectedPropertyURL);
        this._propertyGetterJSON['distanceToFrozenConcept'] += 1;
        let objPropName = ref.translation;
        this.semQJSon[objPropName] = {'value': '<hasReference> ' + objPropName, type: 'objprop'};
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
        // console.log(val, url);
        this.semQJSon[val] = {value: `<hasValue> ` + val, type: 'fValue'};
        if (Number(val)) {
            this.sparqlJSON['filters'].push({'property': encodeURIComponent(url), 'min': Number(val),
                'max': Number(val) + 1});
        } else {
            console.log('orange button pressed');
        }
        this.results = [];
    }

    getSparqlOptionalSelect(indexInp: number) {
        // console.log(indexInp);
        // need URI component in order to send url as JSON.stringify
        this._optSelectJSON = {'uuid': encodeURIComponent(this.tableResult.uuids[indexInp].trim())};
        this._optSelectJSON['language'] = this.lang;
        this._optSelectJSON['orangeCommandSelected'] = {'names': this.sparqlJSON['orangeCommandSelected']['names']};
        console.log(this._optSelectJSON);
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

    editSemanticQuery() {
        let keys: string[] = [];
        for (let key in this.semQJSon) {
            if (this.semQJSon.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        const modalRef = this.modal.open(NgbdModalContent);
        modalRef.componentInstance.modalKeys = keys;
        modalRef.result
            .then((result) => {
                // console.log(result);
                // No filterValue but the toRemove is a Digit Implies FilterValue
                if (result['filterValue'] === null && Number(result['toRemove']) > -1) {
                    console.log('filter', result['toRemove']);
                    this.sentence = this.sentence.replace(this.semQJSon[result['toRemove']]['value'], '');
                    for (let eachFilter of this.sparqlJSON['filters']) {
                        if (Number(result['toRemove']) === eachFilter.min) {
                            this.sparqlJSON['filters'].splice(this.sparqlJSON['filters'].indexOf(eachFilter), 1);
                            console.log(this.sparqlJSON['filters']);
                        }
                    }
                } else if (result['filterValue'] === null && this.semQJSon[result['toRemove']]['type'] === 'objprop') {
                    console.log('objprop deleted');
                    for (let nextProps in this.semQJSon[result['toRemove']]) {
                        if (this.semQJSon[result['toRemove']].hasOwnProperty(nextProps)) {
                            let removalIndex = this.sparqlJSON['parameters'].indexOf(nextProps);
                            if (removalIndex > -1) {
                                console.log(nextProps);
                                this.sparqlJSON['parameters'].splice(removalIndex, 1);
                                this.sparqlJSON['parametersIncludingPath'].splice(removalIndex, 1);
                                this.sentence = this.sentence.replace(
                                    this.semQJSon[result['toRemove']][nextProps]['value'], '');
                            }
                        }
                    }
                    this.sentence = this.sentence.replace(this.semQJSon[result['toRemove']]['value'], '');

                } else if (result['filterValue'] === null && this.semQJSon[result['toRemove']]['type'] === 'dataprop') {

                    console.log('datprop deletion');
                    this.sentence = this.sentence.replace(this.semQJSon[result['toRemove']]['value'], '');
                    let removalIndex = this.sparqlJSON['parameters'].indexOf(result['toRemove']);
                    if (removalIndex > -1) {
                        this.sparqlJSON['parameters'].splice(removalIndex, 1);
                        this.sparqlJSON['parametersIncludingPath'].splice(removalIndex, 1);
                    }
                } else {
                    this.sentence = this.sentence.replace(this.semQJSon[result['toRemove']]['value'], '');
                    this.sentence = this.sentence.replace(this.semQJSon[result['filterValue']]['value'], '');
                    this.sparqlJSON['parametersIncludingPath'].splice(this.sparqlJSON['parameters'].indexOf(
                        result['toRemove']
                    ), 1);
                    this.sparqlJSON['parameters'].splice(this.sparqlJSON['parameters'].indexOf(result['toRemove']), 1);
                    this.sparqlJSON['filters'].splice(this.sparqlJSON['parameters'].indexOf(result['toRemove'], 1));
                }
                delete this.semQJSon[result['toRemove']];
                if (result['filterValue'] !== null) {
                    delete this.semQJSon[result['filterValue']];
                }
            })
            .catch(err => console.log(err));
    }
}
