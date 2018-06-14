import {Component, Input, OnChanges, OnInit, ViewChild, TemplateRef} from '@angular/core';
import { Router } from '@angular/router';
import {ExplorativeSearchService} from './explorative-search.service';
import { Observable } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import {isNumeric} from 'rxjs/util/isNumeric';

@Component({
    selector: 'explore-search-semantic',
    templateUrl: './explorative-search-semantic.component.html',
    styleUrls: ['./explorative-search-semantic.component.css'],
    providers: [ExplorativeSearchService]
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

    // Negotiation Variables
    public negotiationEnable = false;
    private _negotiation_id: any;
    private _negotiation_catalogue_id: any;


    // NEW
    public conceptPaths: any[] = [];
    public propertyResults: any[] = [];
    public dataResults: any[] = []; // All the Available Properties of the Product or Reference via API Call
    public objResults: any[] = [];
    public searchModel = {};

    public searchvalue: string[] = []; // All the values for Properties via API Call
    public valuesAreNumeric = false;
    public disableManualFilters = true;
    public selectedPropertyURL: string; // The Selected Property's URL for API Call
    public valueResults: Object = {}; // Store values after API Call
    public referenceResults: Object = {}; // Store Available References after API Call

    public selectedProperty = {};

    public sparqlJSON: Object = {}; // Building the SPARQL Query upon Interaction
    public tableResult: any; // Available results after SPARQL Execution
    public refResultsRange: any[] = []; // Show all Available references

    public sparqlSelectedOption = {};
    public hiddenElement = false;
    public infoAlert = false;
    public updateInfoAlert = false;
    public emptyFilterAlert = false;

    // Autocompletion Implementation from NG-BOOTSTRAP
    public search = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            map((term: string) => term === '' ? []
                : this.propertyResults.filter(v => v.translatedProperty.toLowerCase()
                    .indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );
    public formatter = (x: {translatedProperty: string}) => x.translatedProperty;



    constructor(private expSearch: ExplorativeSearchService, private router: Router) { }

    /**
     * ngOnChanges: Angular Life Cycle Hook
     * @description: When new search keyword information comes from the parent component
     */
    ngOnChanges(): void {

        if (!this.configSPQ) { return; }
        // console.log(this.configSPQ); // DEBUG_CHECK
        // Reset Variables..
        this.tableResult = {};
        this.selectedPropertyURL = '';
        this.sparqlJSON = {};
        this.sparqlJSON['parametersIncludingPath'] = [];
        this.sparqlJSON['parameters'] = [];
        this.sparqlJSON['parametersURL'] = [];
        this.sparqlJSON['filters'] = [];
        this.sparqlJSON['parametersURL'] = [];
        this.sparqlJSON['propertySources'] = [];
        this.referenceResults = {};
        this.refResultsRange = [];

        this.conceptPaths = [];
        this.propertyResults = [];
        this.dataResults = [];
        this.objResults = [];
        this.searchvalue = [];
        this.sparqlSelectedOption = {};
        this.conceptPaths.push({
            concept: this.configSPQ['frozenConcept'],
            url: this.configSPQ['concept']
        });
        this.sparqlJSON['concept'] = this.configSPQ['concept'];
        this.sparqlJSON['language'] = this.lang;
        // get properties
        this.getPropertiesOfConcept(this.configSPQ);
        this.infoAlert = true;
    }

    ngOnInit(): void {
        this.sparqlJSON['parametersIncludingPath'] = [];
        this.sparqlJSON['parameters'] = [];
        this.sparqlJSON['parametersURL'] = [];
        this.sparqlJSON['filters'] = [];
        this.sparqlJSON['orangeCommandSelected'] = {name: ''};
        this.sparqlJSON['parametersURL'] = [];
        this.sparqlJSON['propertySources'] = [];
    }

    getPropertiesOfConcept(inputJSON) {
        this.propertyResults = [];
        this.dataResults = [];
        this.objResults = [];
        this.expSearch.searchForProperty(inputJSON)
            .then((res) => {
                    // console.log(res); // DEBUG
                    this.propertyResults = res;
                    res.filter(value => {
                        // filter out only datatype properties from all available properties
                        if (value.datatypeProperty) {
                            this.dataResults.push(value);
                        } else if (value.objectProperty) {
                            this.objResults.push(value);
                        }
                    });
                }
            );
    }

    checkUserSelection(valSearchBar: any) {
        (valSearchBar.objectProperty) ? this.getReferenceValues(valSearchBar) : this.getPropertyValues(valSearchBar);
    }

    getPropertyValues(inputJSON) {
        // console.log(inputJSON);
        let dummyJSON = {'conceptURL': this.configSPQ['concept'],
            'propertyURL': encodeURIComponent(inputJSON.propertyURL),
            'propertySource': inputJSON.propertySource};
        this.expSearch.searchForPropertyValues(dummyJSON)
            .then(res => {
                this.valueResults = res;
                this.searchvalue = [];
                this.valueResults['allValues'].filter(v => {
                    this.searchvalue.push(v.includes('^') ? v.split('^')[0] : v);
                });
                this.searchvalue.forEach(val => {
                    this.valuesAreNumeric = isNumeric(val);
                });
                if (!this.searchvalue.length) {
                    this.emptyFilterAlert = true;
                }
            });
        this.selectedProperty = inputJSON;
    }

    getReferenceValues(inputJSON, index?: number) {
        // console.log(inputJSON);
        let dummyJSON = {'conceptURL': this.configSPQ['concept'], 'language': this.configSPQ['language']};
        let jsonforProperties = this.configSPQ;
        let newConcept = '';
        this.expSearch.getReferencesFromConcept(dummyJSON)
            .then(res => {
                console.log(res);
                this.referenceResults = res['allAvailableReferences'][index];
                this.refResultsRange = this.referenceResults['range'];
                jsonforProperties['concept'] = encodeURIComponent(this.refResultsRange[0]['original']);
                jsonforProperties['distanceToFrozenConcept'] += 1;
                console.log(jsonforProperties);
                this.expSearch.searchForProperty(jsonforProperties)
                    .then((resp) => {
                            // console.log(res); // DEBUG
                            this.propertyResults = [];
                            this.updateInfoAlert = true;
                            this.dataResults = [];
                            this.objResults = [];
                            this.propertyResults = resp;
                            resp.filter(value => {
                                // filter out only datatype properties from all available properties
                                if (value.datatypeProperty) {
                                    this.dataResults.push(value);
                                } else if (value.objectProperty) {
                                    this.objResults.push(value);
                                }
                            });
                        setTimeout(() => this.updateInfoAlert = false, 3000);
                        this.conceptPaths.push({
                            concept: this.refResultsRange[0]['translation'],
                            url: this.refResultsRange[0]['original'],
                            objPropUrl: this.referenceResults['objectPropertyURL']
                        });
                        }
                    );
            });
    }

    check(con, i) {
        console.log(i);
        if (i === 0) {
            let dummyJSON = this.configSPQ;
            dummyJSON['concept'] = con.url;
            dummyJSON['distanceToFrozenConcept'] = i;
            console.log(dummyJSON);
            this.getPropertiesOfConcept(dummyJSON);
        } else {
            let dummyJSON = this.configSPQ;
            dummyJSON['concept'] = encodeURIComponent(con.url);
            dummyJSON['distanceToFrozenConcept'] = i;
            console.log(dummyJSON);
            this.getPropertiesOfConcept(dummyJSON);
        }
        this.conceptPaths.length = i + 1;
        this.searchvalue = [];
    }

    filtersSelected(filterValue, ev) {
        if (ev.target.checked) {
            // console.log(this.configSPQ);
            this.sparqlJSON['parameters'].push(this.selectedProperty['translatedProperty']);
            this.sparqlJSON['parametersURL'].push(encodeURIComponent(this.selectedProperty['propertyURL']));
            this.sparqlJSON['propertySources'].push(this.selectedProperty['propertySource']);
            this.sparqlJSON['filters'].push(
                {
                    property: encodeURIComponent(this.selectedProperty['propertyURL']),
                    exactValue: filterValue
                });
            if (this.conceptPaths.length === 1) {
                let pathJSON = {
                    urlOfProperty: encodeURIComponent(this.selectedProperty['propertyURL']),
                    path: [{concept: this.configSPQ['concept']}]
                };
                this.sparqlJSON['parametersIncludingPath'].push(pathJSON);
            } else {
                let pathJSON = {urlOfProperty: encodeURIComponent(this.selectedProperty['propertyURL']), path: []};
                this.conceptPaths.forEach(path => {
                    if ('objPropUrl' in path) {
                        // console.log(path['objPropUrl']);
                        pathJSON.path.push(
                            {
                                concept: encodeURIComponent(path.url),
                                urlOfProperty: encodeURIComponent(path.objPropUrl)
                            });
                    } else {
                        pathJSON.path.push({concept: encodeURIComponent(path.url)});
                    }
                });
                this.sparqlJSON['parametersIncludingPath'].push(pathJSON);
            }
        } else {
            this.sparqlJSON['filters'].splice(
            this.sparqlJSON['filters'].findIndex(fil => fil.exactValue === filterValue), 1);
        }
    }

    applyManualFilter(min, max) {
        if (!(min < -1 && max < -1)) {
            if (!this.sparqlJSON['parameters'].find(p => p === this.selectedProperty['translatedProperty'])) {
                this.sparqlJSON['parameters'].push(this.selectedProperty['translatedProperty']);
                this.sparqlJSON['parametersURL'].push(encodeURIComponent(this.selectedProperty['propertyURL']));
                this.sparqlJSON['propertySources'].push(this.selectedProperty['propertySource']);
                this.sparqlJSON['filters'].push({
                    property: encodeURIComponent(this.selectedProperty['propertyURL']),
                    min: min,
                    max: max
                });
                if (this.conceptPaths.length === 1) {
                    let pathJSON = {
                        urlOfProperty: encodeURIComponent(this.selectedProperty['propertyURL']),
                        path: [{concept: this.configSPQ['concept']}]
                    };
                    this.sparqlJSON['parametersIncludingPath'].push(pathJSON);
                }
            }
        }
    }

    genTable() {
        this.expSearch.getTableValues(this.sparqlJSON)
            .then(res => {
                this.tableResult = res;
            });
    }

    /**
     * Negotaition rerouting
     */
    negotiation(): void {
        // console.log(this._negotation_catalogue_id, this._negotiation_id);
        // console.log(`/simple-search-details?catalogueId=${this._negotation_catalogue_id}&id=${this._negotiation_id}`);
        this.router.navigate(['/simple-search-details'],
            { queryParams: {catalogueId: this._negotiation_catalogue_id, id: this._negotiation_id} });
    }

    getSparqlOptionalSelect(indexUUID) {
        console.log(indexUUID);
        let optSPARQLQuery = {uuid: encodeURIComponent(this.tableResult.uuids[indexUUID].trim()), 'language': this.lang};
        console.log(optSPARQLQuery);
        this.expSearch.getOptionalSelect(optSPARQLQuery)
            .then(res => {
                this.sparqlSelectedOption = res;
                if (this.sparqlSelectedOption['columns'].findIndex(i => i === 'id') >= 0 &&
                    this.sparqlSelectedOption['columns'].findIndex(j => j === 'catalogueId') >= 0) {
                    console.log('Negotiation can exist');
                    this.negotiationEnable = true;
                    let index_id = this.sparqlSelectedOption['columns'].findIndex(i => i === 'id');
                    let index_catalogue = this.sparqlSelectedOption['columns'].findIndex(i => i === 'catalogueId');
                    this._negotiation_id = this.sparqlSelectedOption['rows'][0][index_id];
                    this._negotiation_catalogue_id = this.sparqlSelectedOption['rows'][0][index_catalogue];
                    console.log(this._negotiation_catalogue_id, this._negotiation_id);
                } else {
                    this.negotiationEnable = false;
                }
            });
        this.hiddenElement = true;
    }

    // /**
    //  * hasPropertyRelation:
    //  * use to determine if the main/reference concept has properties.
    //  * triggered when hasProperty button is clicked
    //  */
    // hasPropertyRelation() {
    //    // console.log('hasPropertyRelation', this._propertyGetterJSON);
    //
    //     if (!this.selectedReference) { // If No Reference is Selected, then we are at the main concept
    //         this._propertyGetterJSON['concept'] = this._mainConceptName;
    //         this.whereAreYou = this.configSPQ['frozenConcept'];
    //     }
    //     // API CALL
    //     this.expSearch.searchForProperty(this._propertyGetterJSON)
    //         .then((res) => {
    //             // console.log(res); // DEBUG
    //             res.filter(value => {
    //                 // filter out only datatype properties from all available properties
    //                     if (value['datatypeProperty']) {
    //                         this.dataResults.push(value);
    //                     } else if (value['objectProperty']) {
    //                         this.objResults.push(value);
    //                     }
    //                 });
    //             }
    //         );
    // }
    //
    // /**
    //  * applyProperty:
    //  * Apply changes to UI and SPARQL Query and Semantic Query JSON structures when a Property
    //  * is selected
    //  */
    //
    // applyProperty() {
    //     // Store that property's URL
    //     if (this.model.propertyURL === undefined) {
    //         return;
    //     }
    //     this.selectedPropertyURL = this.model.propertyURL;
    //     let selectedPropName = this.model.translatedProperty;
    //     let insertedPart = ' <hasProperty> ' + this.model.translatedProperty;
    //     this.sentence += insertedPart; // Update the sentence
    //     /**
    //      * For V2.0 References can be passed over.
    //      */
    //     if (this.selectedReference) {
    //         // If the property belongs to a Reference Update the SPARQL Query
    //         if (this.selectedPropertyURL.indexOf('#') > -1) {
    //             this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL.split('#')[1]));
    //         } else {
    //             this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL));
    //         }
    //
    //         this.sparqlJSON['parametersIncludingPath'].push(
    //         {'urlOfProperty': encodeURIComponent(this.model.propertyURL),
    //             'path': [{'concept': this._mainConceptName},
    //                 {'urlOfProperty': encodeURIComponent(this._referenceJSON['objectPropertyURL']),
    //                     'concept': encodeURIComponent(this._referenceJSON['range'][0]['original'])
    //                 }]
    //         });
    //         this.sparqlJSON['parametersURL'].push(encodeURIComponent(this.selectedPropertyURL));
    //         // Add Semantic Query JSON parameters accordingly
    //         for (let semQKeys in this.semQJSon) {
    //             if (this.semQJSon.hasOwnProperty(semQKeys)) {
    //                 if (this.semQJSon[semQKeys]['type'] === 'objprop') {
    //                     this.semQJSon[semQKeys][this.model.translatedProperty] = {value: insertedPart, type: 'dataprop'};
    //                 }
    //             }
    //         }
    //         this.selectedReference = false;
    //     } else { // the property is directly connected to the Main Concept (data properties)
    //         this.applyURL(this.selectedPropertyURL); // create the SPARQL JSON
    //         let propJSON = {value: selectedPropName, type: 'dataprop'};
    //         this.semQJSon['selections'].push(propJSON);
    //     }
    // }
    //
    // /**
    //  * applyURl: When a dataproperty belongs to the Main Concept
    //  * Create the SPARQLJSON Structure
    //  * @param {string} url: URL of the Parameter under consideration
    //  */
    // applyURL(url: string): void {
    //     // this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL));
    //     // console.log(url);
    //     // this.sparqlJSON['parameters'].push(encodeURIComponent(url));
    //     if (this.selectedPropertyURL.indexOf('#') > -1) {
    //         this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL.split('#')[1]));
    //     } else {
    //         this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL));
    //     }
    //     this.sparqlJSON['parametersURL'].push(encodeURIComponent(url));
    //     // this.sparqlJSON['parametersIncludingPath'].push({'urlOfProperty': encodeURIComponent(this.selectedPropertyURL),
    //     //     'path': [{'concept': this.configSPQ['concept']}]});
    //     // console.log('applyURL', this.configSPQ);
    //     this.sparqlJSON['parametersIncludingPath'].push({'urlOfProperty': encodeURIComponent(url),
    //         'path': [{'concept': this.configSPQ['concept']}]});
    //     this.sparqlJSON['propertySources'].push(this.model.propertySource);
    //     this._propertySource = this.model.propertySource;
    // }
    //
    // /**
    //  * hasValueRelation: Search for available Values of the property and display them
    //  * triggered when hasValue button is clicked
    //  * @param {string} inputVal: String value from the clicked panel
    //  */
    // hasValueRelation(inputVal: string) {
    //     this.loading = true;
    //
    //     this.sentence += ' <' + inputVal + '> ';
    //     // console.log('hasValueRelation ', this.configSPQ);
    //     // console.log(this.selectedPropertyURL);
    //     let dummyJSON = {'conceptURL': this.configSPQ['concept'],
    //         'propertyURL': encodeURIComponent(this.selectedPropertyURL),
    //         'propertySource': this._propertySource};
    //     this.expSearch.searchForPropertyValues(dummyJSON)
    //         .then(res => {
    //             this.valueResults = res;
    //             this.searchvalue = this.valueResults['allValues'];
    //             this.loading = false;
    //             this.selectedValue = false;
    //         });
    //
    // }
    //
    // /**
    //  * hasReferenceRelation: If the Product has available references.
    //  * @param {string} inputVal:
    //  */
    // hasReferenceRelation(inputVal: string) {
    //     this.selectedReference = false;
    //     // console.log('hasReferenceRelation', this.configSPQ);
    //     let dummyJSON = {'conceptURL': this.configSPQ['concept'], 'language': this.configSPQ['language']};
    //     this.expSearch.getReferencesFromConcept(dummyJSON)
    //         .then(res => {
    //             // console.log(res);
    //             this.referenceResults = res;
    //             // console.log(this.referenceResults);
    //             // this.sentence += this.referenceResults['allAvailableReferences'][0].translatedProperty;
    //             // this.refResultsRange = this.referenceResults['allAvailableReferences'][0].range;
    //         });
    //
    // }
    //
    // showRefResults(index: number) {
    //     this.refResultsRange = this.referenceResults['allAvailableReferences'][index].range;
    //     // console.log('showRefResults', this.referenceResults['allAvailableReferences'][index]);
    //     this._referenceJSON = this.referenceResults['allAvailableReferences'][index];
    // }
    //
    // referenceSelection(ref: any): void {
    //     this.selectedReference = true;
    //     this.sentence += ' <hasReference> ';
    //     this.sentence = this.sentence + ref.translation;
    //     this.selectedPropertyURL = ref.original;
    //     this.whereAreYou = ref.translation;
    //     // console.log(this._propertyGetterJSON);
    //     this._propertyGetterJSON['concept'] = encodeURIComponent(this.selectedPropertyURL);
    //     this._propertyGetterJSON['distanceToFrozenConcept'] += 1;
    //     let objPropName = ref.translation;
    //     this.semQJSon[objPropName] = {'value': '<hasReference> ' + objPropName, type: 'objprop'};
    // }
    //
    // /**
    //  * When the Orange Buttons are clicked.
    //  * @param {string} inputVal
    //  */
    //
    // objectPropRelation(inputVal: string) {
    //     let orangeJSON = {conceptURL: this.configSPQ['concept'], orangeCommand: inputVal};
    //     this.sentence += ' <' + inputVal + '> ';
    //     this.sparqlJSON['orangeCommandSelected']['names'].push(inputVal);
    //     // console.log(orangeJSON);
    //     // call API
    //     this.expSearch.getPropertyValuesFromOrangeGroup(orangeJSON)
    //         .then(res => {
    //             this.objRelationOutputJSON = res;
    //             console.log(this.objRelationOutputJSON);
    //             this.selectedValue = false;
    //             this.searchvalue = this.objRelationOutputJSON['allValues'];
    //             this.acc.toggle('toggle-value');
    //         });
    // }
    //
    // /**
    //  * Generate table for SPARQL Query
    //  */
    // genTable(): void {
    //     this.loading = true;
    //     // this.sparqlJSON['parametersIncludingPath'].push({'urlOfProperty': encodeURIComponent(this.selectedPropertyURL),
    //     // 'path': [{'concept': this.configSPQ['concept']}]});
    //     // console.log('genTable' + this.configSPQ);
    //     this.sparqlJSON['concept'] = this._mainConceptName;
    //     // this.sparqlJSON['parameters'].push(encodeURIComponent(this.selectedPropertyURL));
    //
    //     // this.sparqlJSON['filters'].push({'property': encodeURIComponent(this.selectedPropertyURL), 'min': Number(this.Value),
    //     //     'max': Number(this.Value) + 1});
    //     this.sparqlJSON['language'] = this.configSPQ['language'];
    //     this.expSearch.getTableValues(this.sparqlJSON)
    //         .then(res => {
    //             this.tableResult = res;
    //             this.loading = false;
    //     });
    // }
    //
    // /**
    //  * If user clicks on values for properties then the filter should be applied
    //  * @param {string} val: particular value (numeric mostly)
    //  * @param {string} url: URL of the property
    //  */
    //
    // applyFilter(val: string, url: string) {
    //     // this.sparqlJSON['filters'].push({'property': encodeURIComponent(this.selectedPropertyURL), 'min': Number(this.Value),
    //     //     'max': Number(this.Value) + 1});
    //     // console.log(val, url);
    //     // add to Semantic Query JSON
    //     // this.semQJSon[val] = {value: `<hasValue> ` + val, type: 'fValue'}; // old implementation
    //     let valJSON = {value: val, type: 'fValue'};
    //     this.semQJSon['selections'].push(valJSON);
    //
    //     /**
    //      *
    //      * V2.0 Implementation for SPARQL fitlers
    //      */
    //     this.sparqlJSON['filters'].push({'property': encodeURIComponent(url), 'exactValue': val});
    //
    //     // if (Number(val)) { // the value is a number add the SPARQL filter for the same
    //     //     this.sparqlJSON['filters'].push({'property': encodeURIComponent(url), 'min': Number(val),
    //     //         'max': Number(val) + 1});
    //     // } else {
    //     //     // console.log('orange button pressed'); // currently no logic for text based filter available
    //     // }
    //     // this.results = []; // avoid clicking the hasValue button again (disable it)
    // }
    //
    // /**
    //  * Optional Sparql Selection table generation
    //  * @param {number} indexInp
    //  */
    //
    // getSparqlOptionalSelect(indexInp: number) {
    //     // console.log(indexInp);
    //     // need URI component in order to send url as JSON.stringify
    //     this.loading = true;
    //     this._optSelectJSON = {'uuid': encodeURIComponent(this.tableResult.uuids[indexInp].trim())};
    //     this._optSelectJSON['language'] = this.lang;
    //     this._optSelectJSON['orangeCommandSelected'] = {'names': this.sparqlJSON['orangeCommandSelected']['names']};
    //     console.log(this._optSelectJSON);
    //     this.expSearch.getOptionalSelect(this._optSelectJSON)
    //         .then(res => {
    //             this.sparqlSelectedOption = res;
    //             this.loading = false;
    //             // this._error_detected_getSPARQLSelect = false;
    //             if (this.sparqlSelectedOption['columns'].findIndex(i => i === 'id') >= 0 &&
    //                 this.sparqlSelectedOption['columns'].findIndex(j => j === 'catalogueId') >= 0) {
    //                 console.log('Negotiation can exist');
    //                 this.negotiationEnable = true;
    //                 let index_id = this.sparqlSelectedOption['columns'].findIndex(i => i === 'id');
    //                 let index_catalogue = this.sparqlSelectedOption['columns'].findIndex(i => i === 'catalogueId');
    //                 this._negotiation_id = this.sparqlSelectedOption['rows'][0][index_id];
    //                 this._negotation_catalogue_id = this.sparqlSelectedOption['rows'][0][index_catalogue];
    //             } else {
    //                 this.negotiationEnable = false;
    //             }
    //         })
    //         .catch(error => {
    //             console.log(error);
    //             // this._error_detected_getSPARQLSelect = true;
    //         });
    //
    //     this.hiddenElement = true;
    // }
    //
    // /**
    //  * Negotaition rerouting
    //  */
    // negotiation(): void {
    //     // console.log(this._negotation_catalogue_id, this._negotiation_id);
    //     // console.log(`/simple-search-details?catalogueId=${this._negotation_catalogue_id}&id=${this._negotiation_id}`);
    //     this.router.navigate(['/simple-search-details'],
    //         { queryParams: {catalogueId: this._negotation_catalogue_id, id: this._negotiation_id} });
    // }
}
