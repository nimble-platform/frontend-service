import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
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

    // Tab selection between Properties or References
    public selectedTab = 'PROPS';
    public allSelectedProperties = new Set();
    public selectedProduct: string;
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
    public loadingFilter = false;
    public emptyFilterAlert = false;
    public disableAddPropBtn = false;
    public propertySelectionComplete = false;

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
        this.hiddenElement = false;
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
        this.loadingFilter = true;
        this.searchvalue = [];
        let dummyJSON = {'conceptURL': this.configSPQ['concept'],
            'propertyURL': encodeURIComponent(inputJSON.propertyURL),
            'propertySource': inputJSON.propertySource};
        this.expSearch.searchForPropertyValues(dummyJSON)
            .then(res => {
                this.valueResults = res;
                this.emptyFilterAlert = false;
                this.disableManualFilters = true;
                this.disableAddPropBtn = false;
                this.valueResults['allValues'].filter(v => {
                    this.searchvalue.push(v.includes('^') ? v.split('^')[0] : v);
                });
                this.searchvalue.forEach(val => {
                    this.valuesAreNumeric = isNumeric(val);
                });
                this.loadingFilter = false;
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
                //console.log(res);
                this.referenceResults = res['allAvailableReferences'][index];
                this.refResultsRange = this.referenceResults['range'];
                jsonforProperties['concept'] = encodeURIComponent(this.refResultsRange[0]['original']);
                jsonforProperties['distanceToFrozenConcept'] += 1;
                //console.log(jsonforProperties);
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
        //console.log(i);
        if (i === 0) {
            let dummyJSON = this.configSPQ;
            dummyJSON['concept'] = con.url;
            dummyJSON['distanceToFrozenConcept'] = i;
            // console.log(dummyJSON);
            this.getPropertiesOfConcept(dummyJSON);
        } else {
            let dummyJSON = this.configSPQ;
            dummyJSON['concept'] = encodeURIComponent(con.url);
            dummyJSON['distanceToFrozenConcept'] = i;
            //console.log(dummyJSON);
            this.getPropertiesOfConcept(dummyJSON);
        }
        this.conceptPaths.length = i + 1;
        this.searchvalue = [];
    }

    noFilterSelected() {
        if (this.sparqlJSON['parameters'].findIndex(name => name === this.selectedProperty['translatedProperty']) > -1) {
            //console.log('already exists');
        } else {
            this.sparqlJSON['parameters'].push(this.selectedProperty['translatedProperty']);
            this.sparqlJSON['parametersURL'].push(encodeURIComponent(this.selectedProperty['propertyURL']));
            this.sparqlJSON['propertySources'].push(this.selectedProperty['propertySource']);
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
        }
        this.propertySelectionComplete = true;
        // Update
        this.allSelectedProperties.add(this.selectedProperty['translatedProperty']);
    }

    /**
     * FILTER Handling: filterSelected
     * If User decides to select the checkbox values
     */
    filtersSelected(filterValue, ev) {
        if (ev.target.checked) {
            // console.log(this.configSPQ);
            if (this.sparqlJSON['parameters'].findIndex(name => name === this.selectedProperty['translatedProperty']) > -1) {
                // console.log('already exists');
            } else {
                this.sparqlJSON['parameters'].push(this.selectedProperty['translatedProperty']);
                this.sparqlJSON['parametersURL'].push(encodeURIComponent(this.selectedProperty['propertyURL']));
                this.sparqlJSON['propertySources'].push(this.selectedProperty['propertySource']);
            }
            if (isNumeric(filterValue)) {
                this.sparqlJSON['filters'].push(
                    {
                        property: encodeURIComponent(this.selectedProperty['propertyURL']),
                        exactValue: filterValue
                    });
            } else {
                this.sparqlJSON['filters'].push(
                    {
                        property: encodeURIComponent(this.selectedProperty['propertyURL']),
                        exactValue: encodeURIComponent(filterValue)
                    });
            }
            if (this.conceptPaths.length === 1) {
                let pathJSON = {
                    urlOfProperty: encodeURIComponent(this.selectedProperty['propertyURL']),
                    path: [{concept: this.configSPQ['concept']}]
                };
                if (this.sparqlJSON['parametersIncludingPath'].findIndex(i => i.urlOfProperty === pathJSON.urlOfProperty) === -1) {
                    this.sparqlJSON['parametersIncludingPath'].push(pathJSON);
                }
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
                if (this.sparqlJSON['parametersIncludingPath'].findIndex(i => i.urlOfProperty === pathJSON.urlOfProperty) === -1) {
                    this.sparqlJSON['parametersIncludingPath'].push(pathJSON);
                }
            }
            this.disableAddPropBtn = true;

        } else {
            this.sparqlJSON['filters'].splice(
            this.sparqlJSON['filters'].findIndex(fil => fil.exactValue === filterValue), 1);
        }
        // console.log(this.sparqlJSON);
        this.allSelectedProperties.add(this.selectedProperty['translatedProperty']);
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
            } else if (!this.sparqlJSON['filters'].length) {
                this.sparqlJSON['filters'].push({
                    property: encodeURIComponent(this.selectedProperty['propertyURL']),
                    min: min,
                    max: max
                });
            }
        }
        this.propertySelectionComplete = true;
        this.allSelectedProperties.add(this.selectedProperty['translatedProperty']);
    }

    removeManualFilter(minVal) {
        let filterIndexToRemove =
            this.sparqlJSON['filters'].findIndex(p => p.property === encodeURIComponent(this.selectedProperty['propertyURL']));
        if (filterIndexToRemove > -1 && this.sparqlJSON['filters'][filterIndexToRemove]['min'] === minVal) {
            this.sparqlJSON['filters'].splice(filterIndexToRemove, 1);
        }
    }

    removeSelection(name) {
        this.allSelectedProperties.delete(name);
        let tableIndexToRemove = this.tableResult['columns'].findIndex(i => i === name);
        let propIndexToRemove = this.sparqlJSON['parameters'].findIndex(i => i === name);
            if (tableIndexToRemove === 0 && this.tableResult['columns'].length === 1) {
                this.tableResult['uuids'] = [];
            }
            if (propIndexToRemove > -1) {
                this.tableResult['rows'].forEach(entry => {
                    entry.splice(tableIndexToRemove, 1);
                });
                this.tableResult['columns'].splice(tableIndexToRemove, 1);

                // remove selection from SPARQL
                this.sparqlJSON['parameters'].splice(propIndexToRemove, 1);
                let removePropURL = this.sparqlJSON['parameters'][propIndexToRemove];
                this.sparqlJSON['parametersURL'].splice(propIndexToRemove, 1);
                this.sparqlJSON['parametersIncludingPath'].splice(propIndexToRemove, 1);
                this.sparqlJSON['propertySources'].splice(propIndexToRemove, 1);
                let filterIndexToRemove = this.sparqlJSON['filters'].findIndex(el => el.property === removePropURL);
                if (filterIndexToRemove > -1) {
                    this.sparqlJSON['filters'].splice(filterIndexToRemove);
                }
            }
            if (!(this.tableResult['uuids'].length && this.tableResult['columns'].length)) {
                // if the whole tableResult is now empty
                this.tableResult['columns'] = undefined;
            }
    }

    onSelectTab(event: any) {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    genTable() {
        this.selectedProduct = '';
        this.expSearch.getTableValues(this.sparqlJSON)
            .then(res => {
                this.tableResult = res;
            });
    }

    /**
     * Negotaition rerouting
     */
    negotiation(): void {
        // console.log(this._negotiation_catalogue_id, this._negotiation_id)
        this.router.navigate(['/product-details'],
            { queryParams: {catalogueId: this._negotiation_catalogue_id, id: this._negotiation_id} });
    }

    getSparqlOptionalSelect(indexUUID) {
        // console.log(indexUUID);
        let optSPARQLQuery = {uuid: encodeURIComponent(this.tableResult.uuids[indexUUID].trim()), 'language': this.lang};
        // console.log(optSPARQLQuery);
        this.expSearch.getOptionalSelect(optSPARQLQuery)
            .then(res => {
                this.sparqlSelectedOption = res;
                if (this.sparqlSelectedOption['columns'].findIndex(i => i === 'ManufacturersItemIdentification') >= 0 &&
                    this.sparqlSelectedOption['columns'].findIndex(j => j === 'CatalogueDocumentReference') >= 0) {
                    // console.log('Negotiation can exist');
                    this.negotiationEnable = true;
                    let index_id = this.sparqlSelectedOption['columns'].findIndex(i => i === 'ManufacturersItemIdentification');
                    let index_catalogue = this.sparqlSelectedOption['columns'].findIndex(i => i === 'CatalogueDocumentReference');
                    this._negotiation_id = this.sparqlSelectedOption['rows'][0][index_id];
                    this._negotiation_catalogue_id = this.sparqlSelectedOption['rows'][0][index_catalogue];
                    // console.log(this._negotiation_catalogue_id, this._negotiation_id);
                } else {
                    this.negotiationEnable = false;
                }
            });
        this.hiddenElement = true;
        this.selectedProduct = indexUUID;
    }
}
