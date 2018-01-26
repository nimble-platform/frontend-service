import {Component, Input, OnChanges, OnInit, ViewChild, TemplateRef} from '@angular/core';
import { Router } from '@angular/router';
import {ExplorativeSearchService} from './explorative-search.service';
import { Observable } from 'rxjs/Observable';
import {NgbAccordionConfig, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

/**
 * Modal Component: When the user clicks on the Semantic Query <code></code>
 * modal provides all the available keywords from the query that can be removed.
 *
 * */

@Component({
    selector: 'ngbd-modal-content',
    template: `
        <!-- header for Modal -->
    <div class="modal-header">
      <h4 class="modal-title">Edit your Semantic Query</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
        
    <!-- Body for Modal -->
    <div class="modal-body">
        <p>Available Keywords that can be Removed:</p>
        <p><strong>Note</strong>: <em>keyword</em> here actually means the main concept and cannot be deleted</p>
        <!-- if user never provides a property/reference then present this for understanding -->
        <p *ngIf="modalKeys.length === 1"><b> No Semantic Query Created ! </b></p>
        <!-- if keywords exist, provide deletion (one by one) for the same -->
      <ul *ngIf="modalKeys.length > 1">
          <li *ngFor="let eachKey of modalKeys; let i=index;">
              <div>
                <span><code>{{eachKey}}</code></span> 
                  <button class="btn-xs btn-danger" *ngIf="i > 0" (click)="removeQParam(eachKey,i);">&times;</button>
              </div>
          </li>
      </ul>
    </div>
  `
})

/**
 * Class: NgbdModalContent
 * @description: Provides deletion logic of keywords.
 */

export class NgbdModalContent {
    @Input() modalKeys: string[] = []; // get all the available keys from `semQJson` to modal for display
    constructor(public activeModal: NgbActiveModal) {} // work on activeModal

    /**
     * removeQParam: Remove Query Parameters
     * @param {string} keyword: name of the key displayed in Modal
     * @param {number} clickedIndex: Index within the modalKeys array
     */

    removeQParam(keyword: string, clickedIndex: number) {
        // console.log(this.modalKeys[clickedIndex + 1]); // DEBUG

        // If the user clicks on a filter keyword which is a data typeproperty with filter values
        // remove the property alongside the filter associated with it
        if (Number(this.modalKeys[clickedIndex + 1]) > 0) {
            // send to the Parent component, the keyword itself and the succedding filter value
            this.activeModal.close({toRemove: keyword, filterValue: this.modalKeys[clickedIndex + 1]});
        }
        // else just send the keyword
        this.activeModal.close({toRemove: keyword, filterValue: null});
        // remove the deleted keyword from the list
        this.modalKeys.splice(clickedIndex + 1, 1);
        this.modalKeys.splice(clickedIndex, 1);
    }
}

/**
 * Main Semantic Search Component
 */
@Component({
    selector: 'explore-search-semantic',
    templateUrl: './explorative-search-semantic.component.html',
    styleUrls: ['./explorative-search-semantic.component.css'],
    providers: [ExplorativeSearchService, NgbAccordionConfig]
})

/**
 * Class: ExplorativeSearchSemanticComponent
 * @description: Provide Logic for building a Semantic Query Pattern for Product under Consideration
 *  It consists of buttons where the user can obtain valuable information for datatype and objecttype property
 *  under consideration. Upon Interaction with these Buttons, Accordion provides further searchable information
 *  for the properties and its values.
 */

export class ExplorativeSearchSemanticComponent implements OnChanges, OnInit {
    // Components from the Parent Component (ExplorativeSearchFormComponent)
    @Input() configSPQ: Object;
    @Input() lang: string;

    private _propertyGetterJSON: Object = {}; // When going further with references, provide a private json for API call
    private _mainConceptName = ''; // Used when traversing through References of product (objectProperties)

    public whereAreYou = ''; // Displays the Current 'Cursor' when traversing through the ontology

    // Orange Buttons Information from API
    private objectRelationsButton = {};
    public objRelationOutputJSON = {};

    private _optSelectJSON = {}; // SPARQL Optional Selection JSON for API Call
    public sparqlSelectedOption = {}; // SPARQL Optional Selection JSON for API Call

    // Accordion Control
    @ViewChild('acc') acc;

    // Modal For Deletion Feature
    @ViewChild('content') modalContent: TemplateRef<void>;

    public semQJSon: Object = {}; // Create a Responsive JSON structure for Semantic Query for Deletion Feature

    // reference JSON
    private _referenceJSON: Object = {};

    // Negotiation Variables
    public negotiationEnable: boolean = false;
    private _negotiation_id: any;
    private _negotation_catalogue_id: any;


    public hiddenElement: boolean = false; // Hiding Table Information

    public sentence: string = ''; // The Semantic Sentence that the User actually sees

    public model: any; // for the AutoCompletion Feature in Text Box

    public selectedValue: boolean = false; // If the user clicks on available values in Accordion
    public selectedReference: boolean = false; // If the user clicks on the a Reference in Accordion

    public results: any[] = []; // All the Available Properties of the Product or Reference via API Call
    public searchvalue: string[] = []; // All the values for Properties via API Call
    public selectedPropertyURL: string; // The Selected Property's URL for API Call
    public valueResults: Object = {}; // Store values after API Call
    public referenceResults: Object = {}; // Store Available References after API Call

    public sparqlJSON: Object = {}; // Building the SPARQL Query upon Interaction
    public tableResult: any; // Available results after SPARQL Execution
    public refResultsRange: any[] = []; // Show all Available references
    basicInfoAlert = false;

    // Autocompletion Implementation from NG-BOOTSTRAP
    public search = (text$: Observable<string>) =>
        text$
            .debounceTime(200)
            .map(term => term === '' ? []
                : this.results.filter(v => v.translatedProperty.toLowerCase()
                    .indexOf(term.toLowerCase()) > -1).slice(0, 10));
    public formatter = (x: {translatedProperty: string}) => x.translatedProperty;



    constructor(private expSearch: ExplorativeSearchService, private router: Router,
                private accConfig: NgbAccordionConfig, private modal: NgbModal) {
        accConfig.closeOthers = true; // Make sure the accordions are all closed on Initialization
    }

    /**
     * ngOnChanges: Angular Life Cycle Hook
     * @description: When new search keyword information comes from the parent component
     */
    ngOnChanges(): void {

        if (!this.configSPQ) { return; }
        // Store the Main Concept under Search
        this._mainConceptName = this.configSPQ['concept'];
        // console.log(this.configSPQ); // DEBUG_CHECK
        this._propertyGetterJSON = this.configSPQ;
        // console.log(this._propertyGetterJSON); // DEBUG_CHECK
        // get the Orange Buttons
        this.expSearch.getSQPButton(this.configSPQ)
            .then(res => this.objectRelationsButton = res);
        // Add the main concept in the Sentence
        this.sentence = this.configSPQ['frozenConcept'];
        // Start building the Semantic Query JSON
        this.semQJSon = {};
        this.semQJSon['keyword'] = {value: this.configSPQ['frozenConcept'], type: 'main'};
        // Reset Variables..
        this.tableResult = {};
        this.selectedPropertyURL = '';
        this.sparqlJSON = {};
        this.sparqlJSON['parametersIncludingPath'] = [];
        this.sparqlJSON['parameters'] = [];
        this.sparqlJSON['parametersURL'] = [];
        this.sparqlJSON['filters'] = [];
        this.sparqlJSON['orangeCommandSelected'] = {names: []};
        this.referenceResults = {};
        this.refResultsRange = [];

        // if any Accordion Panel was Previously Open; Close them upon Reset.
        if (this.acc.activeIds.length) {
            this.acc.activeIds.forEach(openPanel => {
                // console.log(openPanel);
                this.acc.toggle(openPanel);
            });
        }
        this.results = [];
        this.searchvalue = [];
        // Let the User know where they start at.
        this.whereAreYou = this.configSPQ['frozenConcept'];
    }

    ngOnInit(): void {
        this.sparqlJSON['parametersIncludingPath'] = [];
        this.sparqlJSON['parameters'] = [];
        this.sparqlJSON['parametersURL'] = [];
        this.sparqlJSON['filters'] = [];
        this.sparqlJSON['orangeCommandSelected'] = {name: ''};
        this.accConfig.closeOthers = true;
        this.semQJSon = {};
        setTimeout(() => this.basicInfoAlert = true, 6000);
    }

    /**
     * hasPropertyRelation:
     * use to determine if the main/reference concept has properties.
     * triggered when hasProperty button is clicked
     */
    hasPropertyRelation() {
       // console.log('hasPropertyRelation', this._propertyGetterJSON);

        if (!this.selectedReference) { // If No Reference is Selected, then we are at the main concept
            this._propertyGetterJSON['concept'] = this._mainConceptName;
            this.whereAreYou = this.configSPQ['frozenConcept'];
        }
        // API CALL
        this.expSearch.searchForProperty(this._propertyGetterJSON)
            .then((res) => {
                // console.log(res); // DEBUG
                this.results = [];
                res.filter(value => {
                    // filter out only datatype properties from all available properties
                        if (value.datatypeProperty) {
                            this.results.push(value);
                        }
                    });
                }
            );
    }

    /**
     * applyProperty:
     * Apply changes to UI and SPARQL Query and Semantic Query JSON structures when a Property
     * is selected
     */

    applyProperty() {
        // Store that property's URL
        this.selectedPropertyURL = this.model.propertyURL;
        let selectedPropName = this.model.translatedProperty;
        let insertedPart = ' <hasProperty> ' + this.model.translatedProperty;
        this.sentence += insertedPart; // Update the sentence
        console.log(selectedPropName);
        if (this.selectedReference) {
            // If the property belongs to a Reference Update the SPARQL Query
            this.sparqlJSON['parameters'].push(selectedPropName);
            this.sparqlJSON['parametersIncludingPath'].push(
            {'urlOfProperty': encodeURIComponent(this.model.propertyURL),
                'path': [{'concept': this._mainConceptName},
                    {'urlOfProperty': encodeURIComponent(this._referenceJSON['objectPropertyURL']),
                        'concept': encodeURIComponent(this._referenceJSON['range'][0]['original'])
                    }]
            });
            this.sparqlJSON['parametersURL'].push(encodeURIComponent(this.selectedPropertyURL));
            // Add Semantic Query JSON parameters accordingly
            for (let semQKeys in this.semQJSon) {
                if (this.semQJSon.hasOwnProperty(semQKeys)) {
                    if (this.semQJSon[semQKeys]['type'] === 'objprop') {
                        this.semQJSon[semQKeys][this.model.translatedProperty] = {value: insertedPart, type: 'dataprop'};
                    }
                }
            }
            this.selectedReference = false;
        }else { // the property is directly connected to the Main Concept
            this.applyURL(this.selectedPropertyURL, selectedPropName);
            this.semQJSon[selectedPropName] = {value: insertedPart, type: 'dataprop'};
        }
    }

    /**
     * applyURl: When a dataproperty belongs to the Main Concept
     * Create the SPARQLJSON Structure
     * @param {string} url: URL of the Parameter under consideration
     */
    applyURL(url: string, propName: string): void {
        // this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL));
        // console.log(url);
        // this.sparqlJSON['parameters'].push(encodeURIComponent(url));
        // this.sparqlJSON['parameters'].push(propName);
        this.sparqlJSON['parameters'].push(url.split('#')[1]);
        this.sparqlJSON['parametersURL'].push(encodeURIComponent(url));
        // this.sparqlJSON['parametersIncludingPath'].push({'urlOfProperty': encodeURIComponent(this.selectedPropertyURL),
        //     'path': [{'concept': this.configSPQ['concept']}]});
        // console.log('applyURL', this.configSPQ);
        this.sparqlJSON['parametersIncludingPath'].push({'urlOfProperty': encodeURIComponent(url),
            'path': [{'concept': this.configSPQ['concept']}]});
    }

    /**
     * hasValueRelation: Search for available Values of the property and display them
     * triggered when hasValue button is clicked
     * @param {string} inputVal: String value from the clicked panel
     */
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

    /**
     * hasReferenceRelation: If the Product has available references.
     * @param {string} inputVal:
     */
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

    /**
     * When the Orange Buttons are clicked.
     * @param {string} inputVal
     */

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

    /**
     * Generate table for SPARQL Query
     */
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

    /**
     * If user clicks on values for properties then the filter should be applied
     * @param {string} val: particular value (numeric mostly)
     * @param {string} url: URL of the property
     */

    applyFilter(val: string, url: string) {
        // this.sparqlJSON['filters'].push({'property': encodeURIComponent(this.selectedPropertyURL), 'min': Number(this.Value),
        //     'max': Number(this.Value) + 1});
        // console.log(val, url);
        // add to Semantic Query JSON
        this.semQJSon[val] = {value: `<hasValue> ` + val, type: 'fValue'};

        if (Number(val)) { // the value is a number add the SPARQL filter for the same
            this.sparqlJSON['filters'].push({'property': encodeURIComponent(url), 'min': Number(val),
                'max': Number(val) + 1});
        } else {
            // console.log('orange button pressed'); // currently no logic for text based filter available
        }
        this.results = []; // avoid clicking the hasValue button again (disable it)
    }

    /**
     * Optional Sparql Selection table generation
     * @param {number} indexInp
     */

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

    /**
     * Negotaition rerouting
     */
    negotiation(): void {
        // console.log(this._negotation_catalogue_id, this._negotiation_id);
        // console.log(`/simple-search-details?catalogueId=${this._negotation_catalogue_id}&id=${this._negotiation_id}`);
        this.router.navigate(['/simple-search-details'],
            { queryParams: {catalogueId: this._negotation_catalogue_id, id: this._negotiation_id} });
    }

    /**
     * If the user clicks the Semantic Query, provide the Modal for Deletion Here.
     *
     */
    editSemanticQuery() {
        // Get all the keys from the Semantic Query JSON
        let keys: string[] = [];
        for (let key in this.semQJSon) {
            if (this.semQJSon.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        // send the keys to the Modal for Display
        const modalRef = this.modal.open(NgbdModalContent);
        modalRef.componentInstance.modalKeys = keys;
        modalRef.result
            .then((result) => { // how the user interacted with Modal
                console.log(result);
                // No filterValue but the `toRemove` is a Digit Implies FilterValue
                if (result['filterValue'] === null && Number(result['toRemove']) > -1) {
                    // console.log('filter', result['toRemove']);

                    // edit the sentence (remove the keywords)
                    this.sentence = this.sentence.replace(this.semQJSon[result['toRemove']]['value'], '');

                    // remove the filter from the SPARQL QUERY too
                    for (let eachFilter of this.sparqlJSON['filters']) {
                        if (Number(result['toRemove']) === eachFilter.min) {
                            this.sparqlJSON['filters'].splice(this.sparqlJSON['filters'].indexOf(eachFilter), 1);
                            // console.log(this.sparqlJSON['filters']);
                            this.results = []; // disable the value button in order to avoid false values to be displayed
                            this.searchvalue = []; // empty the values array
                        }
                    }
                } else if (result['filterValue'] === null && this.semQJSon[result['toRemove']]['type'] === 'objprop') {
                    // If the user selected an objectproperty; then remove the prop and it's dataprop
                    // console.log('objprop deleted');
                    for (let nextProps in this.semQJSon[result['toRemove']]) {
                        if (this.semQJSon[result['toRemove']].hasOwnProperty(nextProps)) {
                            let removalIndex = this.sparqlJSON['parameters'].indexOf(nextProps);
                            if (removalIndex > -1) {
                                console.log(nextProps);
                                this.sparqlJSON['parameters'].splice(removalIndex, 1);
                                this.sparqlJSON['parametersIncludingPath'].splice(removalIndex, 1);
                                this.sparqlJSON['parametersURL'].splice(removalIndex, 1);
                                this.sentence = this.sentence.replace(
                                    this.semQJSon[result['toRemove']][nextProps]['value'], '');
                            }
                        }
                    }
                    this.sentence = this.sentence.replace(this.semQJSon[result['toRemove']]['value'], '');

                } else if (result['filterValue'] === null && this.semQJSon[result['toRemove']]['type'] === 'dataprop') {
                    // Remove a dataproperty of the main concept
                    // console.log('datprop deletion');
                    this.sentence = this.sentence.replace(this.semQJSon[result['toRemove']]['value'], '');
                    let removalIndex = this.sparqlJSON['parameters'].indexOf(result['toRemove']);
                    if (removalIndex > -1) {
                        this.sparqlJSON['parameters'].splice(removalIndex, 1);
                        this.sparqlJSON['parametersIncludingPath'].splice(removalIndex, 1);
                        this.sparqlJSON['parametersURL'].splice(removalIndex, 1);
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
