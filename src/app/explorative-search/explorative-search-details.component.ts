/**
 * This file takes care of the details of Visualization
 * of the Data (JSON) that will be received from Backend
 * It also sends data to the filter attributes of the Nodes.
 *
 * Parent of this Component: explorative-search-form.component
 * Child of this component: explorative-search-filter.component
 */

import { Component, AfterViewInit, ViewChild, ElementRef, Input, OnChanges } from '@angular/core';
import * as go from 'gojs';
import { RecClass } from './model/RecClass';
import { ExplorativeSearchService } from './explorative-search.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
    selector: 'explore-search-details',
    templateUrl: './explorative-search-details.component.html',
    styleUrls: ['./explorative-search-details.component.css'],
    providers: [ExplorativeSearchService]
})


export class ExplorativeSearchDetailsComponent implements AfterViewInit, OnChanges {

    @Input() config: Object; // this comes from `explorative-search-form.component` (Parent)
    @Input() lang: string; // language selection which comes from the Parent
    @ViewChild('myDiagramDiv') div: ElementRef; // GoJS div as mentioned above in the @Component `template` param
    private hiddenElement: boolean = false; // to hide the graph or table
    /*GOJS Variables*/
    private myDiagram: go.Diagram;
    private $ = go.GraphObject.make;
    /*Parameters that will be passed to `explorative-search-filter.component (Child)*/
    arrayPassedToChild: any[] = []; // this is passed to the child NOW
    private filterQueryRoot: string;
    private filterQueryRootUrl: string;
    filterQuery: string;
    private nodeFilterName: string;
    private filterJSON: Object;
    /* To store selected properties*/
    private selectedProperties: Array<string> = [];
    private selectedNodeKeys: any[] = [];
    private _nodeKeysBackup: any[] = [];
    /* SPARQL TABLE Variables */
    private sparqlSelectedOption: Object;
    private tableJSON: Object = {};
    private _tableJSONPaths = []; // for storing Paths when the figure is rendered again..
    private collectionOfFiltersFromChildren: any[] = []; // filters from the Children Components
    private _optSelectJSON = {};
    private _negotiation_id;
    private _negotiation_catalogue_id;
    public negotiationEnable: boolean = false;

    /*Final Data to be sent back to parent for processing.*/
    finalSelectionJSON: Object;

    /*The API response from tableJSON will be stored in tableResult*/
    tableResult: any;

    private _error_detected_getProperties = false;
    private _error_detected_getLogicalView = false;
    private _error_detected_getSPARQLSelect = false;
    private _error_detected_getTableValues = false;
    private _warning_table_results = false;
    // BackEnd Service + Modal Service declared here
    constructor(private expSearch: ExplorativeSearchService, private modalService: NgbModal, private router: Router) { }

    private open(content) { // display the Modal when CTRL is released or Single Select Feature Enabled..
        this.modalService.open(content);
    }
    /**
     * using OnChanges LifeCycle Hook for incoming Configuration
     * from the Parent Component
     */
    ngOnChanges(): void {
        if (!this.config) { return; }
        // console.log(this.config['viewStructure']); // DEBUG -CHECK
        let recApproach = new RecClass();
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$, 2);
        // Reset Selections for New Diagram.. Usually when the user clicks the button about the product..
        this.selectedProperties = [];
        this.tableResult = {};
        this.filterJSON = {};
        this.filterQueryRoot = '';
        this.filterQueryRootUrl = '';
        this.filterQuery = '';
        this.nodeFilterName = '';
        this.selectedNodeKeys = [];
        // reset errors/warnings too since this is a fresh start.
        this._error_detected_getSPARQLSelect = false;
        this._error_detected_getTableValues = false;
        this._error_detected_getProperties = false;
        this._error_detected_getLogicalView = false;
        this._warning_table_results = false;
    }

    /**
     * AfterViewInit LifeCycle Hook for diagram initialization for GoJS
     */
    ngAfterViewInit(): void {
        this.myDiagram = this.$(go.Diagram, this.div.nativeElement,
            {
                initialContentAlignment: go.Spot.Center,
                padding: 10,
                isReadOnly: false,
                'animationManager.isEnabled': false, // disable Animation
                'allowVerticalScroll': false, // no vertical scroll for diagram
                'toolManager.mouseWheelBehavior': go.ToolManager.WheelNone // do not zoom diagram on wheel scroll
            });
        this.myDiagram.addLayerBefore(this.$(go.Layer, { name: 'red' }), this.myDiagram.findLayer('Grid'));
        this.myDiagram.addLayerBefore(this.$(go.Layer, { name: 'green' }), this.myDiagram.findLayer('Grid'));
        let commonToolTip = this.$(go.Adornment, 'Auto',
            {
                isShadowed: true
            },
            this.$(go.Shape, { fill: '#FFFFCC' }),
            this.$(go.Panel, 'Vertical',
                {
                    margin: 3
                },
                this.$(go.TextBlock,  // bound to node data
                    {
                        margin: 4, font: 'bold 12pt sans-serif'
                    },
                    new go.Binding('text')),
                this.$(go.TextBlock,  // bound to Adornment because of call to Binding.ofObject
                    new go.Binding('text', '',
                        (ad) => {
                            return 'Connections: ' + ad.adornedPart.linksConnected.count;
                        }).ofObject())
            )  // end Vertical Panel
        );  // end Adornment
        this.myDiagram.nodeTemplate =
            this.$(go.Node, 'Spot',
                {
                    locationSpot: go.Spot.Center,
                    locationObjectName: 'SHAPE',  // Node.location is the center of the Shape
                    selectionAdorned: false, // keep it false to differentiate between click and drag of a node..
                    click: (e: go.InputEvent, obj: go.GraphObject): void => { this.nodeClicked(e, obj); },
                    toolTip: commonToolTip,
                },
                this.$(go.Shape, 'Circle',
                    {
                        name: 'SHAPE',
                        fill: 'lightgray',  // default value, but also data-bound
                        stroke: 'transparent',
                        strokeWidth: 2,
                        desiredSize: new go.Size(20, 20),
                        portId: ''  // so links will go to the shape, not the whole node
                    },
                    new go.Binding('fill', 'color')),
                this.$(go.TextBlock,
                    {
                        name: 'TEXTBLOCK',
                        alignment: go.Spot.Right,
                        alignmentFocus: go.Spot.Left
                    },
                    new go.Binding('text')),
                    new go.Binding('layerName', 'color')
            );

        // this is the root node, at the center of the circular layers
        this.myDiagram.nodeTemplateMap.add('Root',
            this.$(go.Node, 'Auto',
                {
                    locationSpot: go.Spot.Center,
                    selectionAdorned: true,
                    toolTip: commonToolTip
                },
                this.$(go.Shape, 'Circle',
                    { fill: 'white' }),
                this.$(go.TextBlock,
                    { font: 'bold 12pt sans-serif', margin: 5 },
                    new go.Binding('text'))
            ));

        // define the Link template
        this.myDiagram.linkTemplate =
            this.$(go.Link,
                {
                    routing: go.Link.Normal,
                    curve: go.Link.Bezier,
                    selectionAdorned: false,
                    layerName: 'Background'
                },
                this.$(go.Shape,
                    {
                        stroke: 'black',  // default value, but is data-bound
                        strokeWidth: 1
                    },
                    new go.Binding('stroke', 'color'))
            );
        this.myDiagram.addDiagramListener('ChangedSelection', (e: any) => {
            // check for selection changes.. especially when Multiselect is off
            if (e.diagram.selection.count === 0) { // if in non Multiselect all selections removed
                // reset all
                this.selectedProperties = [];
                this.tableJSON = {};
                this.tableResult = {};
                this.filterJSON = {};
                this.filterQueryRoot = '';
                this.filterQuery = '';
                this.nodeFilterName = '';
                if (this.finalSelectionJSON === undefined) {
                    // make the JSON
                    this.finalSelectionJSON = {'root': this.filterQueryRootUrl, 'filter': []};
                    // console.log('Hardcode selection', this.finalSelectionJSON); // DEBUG-CHECK
                } else {
                    if (this.finalSelectionJSON['filter'].length > 0) {
                        this.finalSelectionJSON['filter'] = [];
                    }
                }
                this.arrayPassedToChild = [];
                this.collectionOfFiltersFromChildren = [];
                this._nodeKeysBackup = this.selectedNodeKeys;
                this.selectedNodeKeys = [];
                this._warning_table_results = false;
            }
            });
    }


    /**
     * nodeClicked: function handles the click feature for GoJS Diagram
     * @param ev : event parameter
     * @param node: node entity
     */
    private nodeClicked(ev, node): void {
        node.selectionAdorned = true; // show adornment only when the node is clicked or selected..
        let pathJSON = {}; // for tableJSON['paramatersIncludingPath'] ..
        let jsonFilterForEachChild = {}; // for Filters to be displayed ..
        let rootConcept = node.part.findTreeRoot().data.text; // get the ROOT name
        let clickedNode = node.part.data.text; // name of the clicked node
        let rootConceptUrl = this.config['viewStructure']['concept']['url']; // get ROOT URL
        let nodeConceptUrl; // clicked node's URL
        let immediateParentName = node.part.findTreeParentNode().data.text; // If there is a parent between ROOT and Node

        if (immediateParentName === rootConcept) { // at this point check if the immediate parent is same as root concept
            // we are in layer 1 All green nodes
            for (let eachDatProp of this.config['viewStructure']['dataproperties']) { // get the Node's URL
                if (eachDatProp['translatedURL'] === clickedNode) { // if first layer data properties
                    let index = this.config['viewStructure']['dataproperties'].indexOf(eachDatProp);
                    nodeConceptUrl = this.config['viewStructure']['dataproperties'][index]['url'];
                }
            }
            /*
             * creation of tableJSON['parametersIncludingPath']
             * if the data property (Green nodes) immediately connected to the root is detected created a simple
             *    pathJSON = {
             *                  urlOfProperty: clicked node's url,
             *                  path: [{
             *                      'concept': root concept's url
             *                  }]
             *    }
             */
            pathJSON['urlOfProperty'] = encodeURIComponent(nodeConceptUrl);
            pathJSON['path'] = [{concept: encodeURIComponent(rootConceptUrl)}];
            if (! ('parametersIncludingPath' in this.tableJSON) || this.tableJSON['parametersIncludingPath'] === undefined) {
                // if the key value pair is not previously not found in the JSON create an empty array..
                // usually triggered for First ever Node click..
                this.tableJSON['parametersIncludingPath'] = [];
            }
        } else { // if URL wasn't found it must be in the object properties (red nodes)
            for (let everyKey in this.config['viewStructure']['objectproperties']) {
                if (this.config['viewStructure']['objectproperties'].hasOwnProperty(everyKey)) {
                    if (this.config['viewStructure']['objectproperties'][everyKey]['concept']['translatedURL'] === immediateParentName) {
                        // find the parent node first and then iterate through..
                        for (let eachDatPropWithinObjProp of this.config['viewStructure']['objectproperties'][everyKey]['dataproperties']) {
                            if (eachDatPropWithinObjProp['translatedURL'] === clickedNode) { // find the clicked node
                                let index = this.config['viewStructure']['objectproperties'][everyKey]
                                    ['dataproperties'].indexOf(eachDatPropWithinObjProp);
                                // get the URL..
                                nodeConceptUrl = this.config['viewStructure']['objectproperties'][everyKey]['dataproperties'][index]['url'];
                                /*
                                 * creation of tableJSON['parametersIncludingPath']
                                 * if data propety belongs to a object property create a complex pathJSON as follows:
                                 *  {
                                 *    urlOfProperty: clicked node's url,
                                 *    path: [
                                 *      {concept: root's url},
                                 *      {urlOfProperty: parent_1 node's objPropertySource, concept: parent_1 node's url},
                                 *      {urlOfProperty: parent_2 node's objPropertySource, concept: parent_2 node's url},
                                 *    ]
                                 *  }
                                 */
                                pathJSON['urlOfProperty'] = encodeURIComponent(nodeConceptUrl);
                                pathJSON['path'] = [];
                                pathJSON['path'].push({concept: encodeURIComponent(rootConceptUrl)}); // root goes in.
                                // iteration through the complete data structure not the one that is seen..
                                // find the keys to the object properties..
                                for (let eachCompKey in this.config['completeStructure']['objectproperties']) {
                                    if (this.config['completeStructure']['objectproperties'].hasOwnProperty(eachCompKey)) {
                                        // at this point the parent of the clicked node has changed ..
                                        // Example: Manufacturer was previously the immediateParentNode
                                        //          after re-rendering the diagram
                                        //          immediateParentNode = Manufacturer/Legislation
                                        // A way to compare the 'viewStructure' and 'completeStructure' would be to
                                        // split the immediateParentNode into ['Manufacturer, 'Legislation']
                                        // find the object who has 'translatedURL'  === 'Manufacturer'
                                        // in the 'completeStructure'
                                        if (this.config['completeStructure']['objectproperties'][eachCompKey]
                                                ['concept']['translatedURL'] === immediateParentName.split('/')[0]) {
                                            // and simply push the 'objectPropertySource' link for the present object
                                            pathJSON['path'].push({
                                                urlOfProperty: encodeURIComponent(this.config['completeStructure']
                                                ['objectproperties'][eachCompKey]['objectPropertySource']),
                                                concept: encodeURIComponent(this.config['completeStructure']
                                                    ['objectproperties'][eachCompKey]
                                                    ['concept']['url'])
                                            });
                                            // console.log('TRUE'); // DEBUG--CHECK if the condition was true
                                        }
                                    }
                                } /*TO DO: try a more concrete way to check the key within the "ConceptURIPath'*/

                                // use the 'objectPropertySource' from the 'viewStructure'. No need for 'completeStructure'
                                pathJSON['path'].push({
                                    urlOfProperty: encodeURIComponent(this.config['viewStructure']
                                        ['objectproperties'][everyKey]['objectPropertySource']),
                                    concept: encodeURIComponent(nodeConceptUrl)
                                });
                                if (! ('parametersIncludingPath' in this.tableJSON) ||
                                    this.tableJSON['parametersIncludingPath'] === undefined) {
                                    // similar logic as above, if does not exist create an Array ..
                                    this.tableJSON['parametersIncludingPath'] = [];
                                }
                            }
                        }
                    }
                }
            }
        }
        // console.log('nodeConceptURL CHECK', nodeConceptUrl); // DEBUG CHECK -> to see if URL for node was acquired..
        if (node.part.layerName === 'red') { // OBJECT Property Clicked (RED NODE)
            this.objPropertyDetails(node);
        } else { // layer green Data properties clicked.... (green node)
            // get values to be passed to child....
            this.nodeFilterName = clickedNode;
            this.filterQuery = nodeConceptUrl;
            this.filterQueryRoot = rootConcept;
            this.filterQueryRootUrl = rootConceptUrl;
            jsonFilterForEachChild['fName'] = this.nodeFilterName;
            jsonFilterForEachChild['fQuery'] = this.filterQuery;
            jsonFilterForEachChild['fQueryRoot'] = this.filterQueryRoot;
            jsonFilterForEachChild['fQueryRootUrl'] = this.filterQueryRootUrl;
            // build the Query Parameter
            let filteringInput = {
                'concept': encodeURIComponent(rootConceptUrl.trim()),
                'property': encodeURIComponent(nodeConceptUrl.trim()), 'amountOfGroups': 3
                , 'language': this.lang
            };
            // MULTISELECTION check..
            if (ev.control) { // if the CTRL Key is pressed..
                // console.log('CTRL key pressed.. Multiselect On'); // DEBUG-CHECK
                if (node.isSelected) { // if the particular node is selected add to list
                    this.selectedNodeKeys.push(node.part.data.key); // store the key of then GoJS node..
                    // avoid duplicate entries in the list
                    if (!this.selectedProperties.find(e => e === nodeConceptUrl)) {
                        this.selectedProperties.push(nodeConceptUrl);
                        // call the respective API...
                        this.expSearch.getPropertyValues(filteringInput)
                            .then(res => {
                                this.filterJSON = res;
                                jsonFilterForEachChild['filterJSON'] = this.filterJSON;
                                setTimeout(() => { // Need to introduce a latency here to avoid filter display errors
                                    this.arrayPassedToChild.push(jsonFilterForEachChild);
                                    // console.log('jsonFilterForChild ', jsonFilterForEachChild);
                                    // console.log('arrayPassedToChild ', this.arrayPassedToChild);
                                }, 500);
                                this._error_detected_getProperties = false;
                            })
                            .catch(error => {
                                console.log(error);
                                this._error_detected_getProperties = true;
                            });
                        // create the tableJSON so the user can
                        // click the RED Button..
                        this.tableJSON['parametersIncludingPath'].push(pathJSON);
                    }
                } else { // the node was clicked again and deselected, hence remove from list
                    let index = this.selectedProperties.indexOf(nodeConceptUrl);
                    if (index > -1) { // Everything is sequentially pushed so with the same index
                        // same index is used to remove node's properties from all arrays
                        this.selectedProperties.splice(index, 1);
                        this.arrayPassedToChild.splice(index, 1);
                        this.tableJSON['parametersIncludingPath'].splice(index, 1);
                        // do not send anything to child .. Remove the Filter from display
                        this.filterJSON = {};
                    }
                    let keyIndex = this.selectedNodeKeys.indexOf(node.part.data.key);
                    if (keyIndex > -1) { // remove the GoJS key value of the node too..
                        this.selectedNodeKeys.splice(keyIndex, 1);
                    }
                }
            } else { // no CTRL Button pressed but node selected -> Single Selection Feature
                // better to warn and let the user understand the usage with CTRL key
                let content = `NO CTRL Button Pressed.
                                If previous Selection were selected using Multiselect Feature,
                                they will be deleted.`;
                this.open(content); // show the modal.. Everytime
                // reset the selections..
                this.selectedProperties = [];
                this.arrayPassedToChild = [];
                this.tableResult = {};
                this.selectedNodeKeys = [];
                this._nodeKeysBackup = [];
                // console.log('CTRL key released.. Multiselect off'); // DEBUG-CHECK
                if (node.isSelected) { // if node is selected in Single Select, add to list
                    // avoid duplicate entries in the list
                    if (!this.selectedProperties.find(e => e === nodeConceptUrl)) {
                        this.selectedProperties.push(nodeConceptUrl);
                        // call the respective API
                        this.expSearch.getPropertyValues(filteringInput)
                            .then(res => {
                                this.filterJSON = res;
                                jsonFilterForEachChild['filterJSON'] = this.filterJSON;
                                setTimeout(() => { // Need to introduce a latency here to avoid filter display errors
                                    this.arrayPassedToChild.push(jsonFilterForEachChild);
                                    // console.log('jsonFilterForChild ', jsonFilterForEachChild);
                                    // console.log('arrayPassedToChild ', this.arrayPassedToChild);
                                }, 500);
                                this._error_detected_getProperties = false;
                            })
                            .catch(error => {
                                console.log(error);
                                this._error_detected_getProperties = true;
                            });
                    }
                    /* add the tableJSON so the user can click on Red Search Button anytime */
                    this.tableJSON['parametersIncludingPath'] = []; // start fresh
                    this.tableJSON['parametersIncludingPath'].push(pathJSON);
                } // if the node is deselected remove if from list via selection.count = 0 for GoJS DiagramListener above
            }
            // console.log(this.selectedProperties); // DEBUG-CHECK
            // if all properties deselected
            if (this.selectedProperties.length === 0) { // remove the table below the diagram
                this.tableResult = {};
            }
        }
    }

    /**
     * Acquiring Node information for Object Properties (RED Node)
     * @param node: go.GraphObject. Red Node that was clicked.
     */
    private objPropertyDetails(node: any): void {
        let immediateParentNode = node.part.findTreeParentNode().data.text; // get the Parent
        let clickedNode = node.part.data.text; // get the clickedNode's text
        // console.log('My Parent is..', immediateParentNode); // DEBUG--CHECK
        // console.log('Me: ', clickedNode); // DEBUG--CHECK
        // console.log('My Key,', node.part.data.key); // DEBUG--CHECK
        for (let eachObjPropKey in this.config['viewStructure']['objectproperties']) {
            // go through the viewStructure configuration to obtain new Logical View
            if (this.config['viewStructure']['objectproperties'].hasOwnProperty(eachObjPropKey)) {
                if (this.config['viewStructure']['objectproperties'][eachObjPropKey]['concept']['translatedURL'] === immediateParentNode) {
                    // console.log(this.config['viewStructure']['objectproperties'][eachObjPropKey]['objectproperties']);
                    for (let eachKeyWithinObjProp in this.config['viewStructure']['objectproperties'][eachObjPropKey]['objectproperties']) {
                        if (this.config['viewStructure']['objectproperties'][eachObjPropKey]
                                ['objectproperties'].hasOwnProperty(eachKeyWithinObjProp)) {
                            if (clickedNode === this.config['viewStructure']['objectproperties'][eachObjPropKey]['objectproperties']
                                    [eachKeyWithinObjProp]['concept']['translatedURL']) {
                                console.log(eachObjPropKey);
                                // build JSON for query getLogicalView
                                    let layerJSON = {
                                    'concept': this.config['viewStructure']['objectproperties'][eachObjPropKey]['objectproperties']
                                        [eachKeyWithinObjProp]['concept']['url'],
                                    'language': this.lang,
                                    'conceptURIPath': this.config['viewStructure']['objectproperties'][eachObjPropKey]['objectproperties']
                                        [eachKeyWithinObjProp]['conceptURIPath'],
                                    'stepRange': 1,
                                    'frozenConcept':  this.config['viewStructure']['objectproperties'][eachObjPropKey]['objectproperties']
                                        [eachKeyWithinObjProp]['frozenConcept'],
                                    'distanceToFrozenConcept':  this.config['viewStructure']['objectproperties'][eachObjPropKey]
                                        ['objectproperties'][eachKeyWithinObjProp]['distanceToFrozenConcept'],
                                    'oldJsonLogicalView': this.config['completeStructure']};
                                    if (this.selectedProperties.length) { // send previous selections to server to retrieve them back
                                        let arrInArr = [];
                                        for (let eachSelection of this.selectedProperties) {
                                            arrInArr.push([eachSelection]);
                                        }
                                        layerJSON['currentSelections'] = arrInArr;
                                    }
                                    // console.log('DYNAMIC JSON ', layerJSON); // DEBUG--CHECK
                                    // call the API..
                                    this.expSearch.getLogicalView(layerJSON)
                                        .then(res => {
                                            this.config = res;
                                            // console.log(this.config['completeStructure']);
                                            // console.log(this.config['viewStructure']);
                                            this._error_detected_getLogicalView = false;
                                        })
                                        .catch(error => {
                                            console.log(error);
                                            this._error_detected_getLogicalView = true;
                                        });
                                    // store the previous tableJSON things in private variable
                                    this._tableJSONPaths = this.tableJSON['parametersIncludingPath'];
                                    // Latency needed in order to avoid double click
                                    // reload the diagram again..
                                    setTimeout(() => {
                                        this.reloadRadialGraph(2, immediateParentNode, clickedNode);
                                    }, 600);
                            }
                        }
                    }

                }
            }
        }
    }
    /**
     * genTable: Generate a Dynamic tableJSON query for the API Call and
     * store result in tableResult Variable
     */
    genTable(): void {
        // console.log('genTable call ', this.tableJSON); // DEBUG-CHECK -> 'parametersIncludingPath' to see if it was right.
        if (this.finalSelectionJSON) { // create the tableJSON
            this.tableJSON['concept'] = encodeURIComponent(this.filterQueryRootUrl);
            this.tableJSON['parameters'] = [];
            for (let eachSelectedProp of this.selectedProperties) {
                this.tableJSON['parameters'].push(encodeURIComponent(eachSelectedProp));
            }
            if (this.collectionOfFiltersFromChildren.length > 0) { // create the filters from the child components
                this.tableJSON['filters'] = [];
                for (let eachFilter of this.collectionOfFiltersFromChildren) {
                    if (this.selectedProperties.indexOf(eachFilter['property']) > -1 ) {
                        this.tableJSON['filters'].push({'property': encodeURIComponent(eachFilter['property']),
                            'min': eachFilter['values'][0], 'max': eachFilter['values'][1]});
                    }
                }
            }else { // if there were no filters from the children
                this.tableJSON['filters'] = [];
            }
        } else { // if user directly clicks on the Search button.. without previously generated finalSelectionJSON
            // console.log('user directly clicked on Search'); // DEBUG-CHECK
            this.tableJSON['concept'] = encodeURIComponent(this.filterQueryRootUrl);
            this.tableJSON['parameters'] = [];
            for (let eachSelectedProp of this.selectedProperties) {
                this.tableJSON['parameters'].push(encodeURIComponent(eachSelectedProp));
            }
            // console.log('filters after direct click', this.tableJSON['filters']); // filters shouldn't exist
        }
        this.tableJSON['language'] = this.lang;
        // console.log(this.tableJSON); // DEBUG-CHECK
        // call the API..
        this.expSearch.getTableValues(this.tableJSON)
            .then(res => {
                this.tableResult = res;
                // console.log(this.tableResult); // DEBUG-CHECK
                (this.tableResult['rows'].length === 0) ? this._warning_table_results = true : this._warning_table_results = false;
                this._error_detected_getTableValues = false;
            })
            .catch(err => {
                console.log(err);
                this._error_detected_getTableValues = true;
            });
    }

    /**
     * Data from the Child's Event Emitter
     * @param finalSelectionJSON same name as the child's variable
     */
    handleFilterSelectionUpdated(finalSelectionJSON) {
        this.finalSelectionJSON = finalSelectionJSON; // assign the JSON from child.
        if (this.finalSelectionJSON['filter'].length > 0) { // push the filters to collection
            this.collectionOfFiltersFromChildren.push(this.finalSelectionJSON['filter'][0]);
            // console.log('collection of filters: ', this.collectionOfFiltersFromChildren); // DEBUG--CHECK
        } else if (this.finalSelectionJSON['filter'].length === 0) { // if the user removed the filter by de-checking filter box
            this.collectionOfFiltersFromChildren.forEach(el => {
                if (el['property'] === this.finalSelectionJSON['child']) {
                    let indexToRemove = this.collectionOfFiltersFromChildren.indexOf(el);
                    this.collectionOfFiltersFromChildren.splice(indexToRemove, 1);
                    // console.log('filter Removed'); //DEBUG-CHECK
                }
            });
        }
        // console.log('returned JSON ', this.finalSelectionJSON); //DEBUG-CHECK
    }

    /**
     * Hide the diagram and show the Complete Product Table instead.
     * @param {number} indexInp The Index of the Table for Complete Product Table
     */

    getSparqlOptionalSelect(indexInp: number) {
        console.log(indexInp);
        // need URI component in order to send url as JSON.stringify
        this._optSelectJSON = {'uuid': encodeURIComponent(this.tableResult.uuids[indexInp].trim())};
        this._optSelectJSON['language'] = this.lang;
        console.log(this._optSelectJSON);
        this.expSearch.getOptionalSelect(this._optSelectJSON)
          .then(res => {
              this.sparqlSelectedOption = res;
              this._error_detected_getSPARQLSelect = false;
              if (this.sparqlSelectedOption['columns'].findIndex(i => i === 'id') >= 0 &&
                  this.sparqlSelectedOption['columns'].findIndex(j => j === 'catalogueId') >= 0) {
                  console.log('Negotiation can exist');
                  this.negotiationEnable = true;
                  let index_id = this.sparqlSelectedOption['columns'].findIndex(i => i === 'id');
                  let index_catalogue = this.sparqlSelectedOption['columns'].findIndex(i => i === 'catalogueId');
                  this._negotiation_id = this.sparqlSelectedOption['rows'][0][index_id];
                  this._negotiation_catalogue_id = this.sparqlSelectedOption['rows'][0][index_catalogue];
              } else {
                  this.negotiationEnable = false;
              }
          })
            .catch(error => {
                console.log(error);
                this._error_detected_getSPARQLSelect = true;
            });
        this.hiddenElement = true;
    }

    /**
     * toggle the diagram and table with the BACK Button
     */
    diagramAgain(): void {
        if (this.hiddenElement) {
            this.hiddenElement = !this.hiddenElement;
        }
    }

    /**
     * Reload the Diagram with the new Layer..
     * @param {number} lay: how many layers of the diagram to be shown.
     * @param pNode Parent Node of the ObjectProperty node
     * @param cNode ChildNode (Clicked Node itself)
     */
    private reloadRadialGraph(lay: number, pNode: any, cNode: any): void {
        let recApproach = new RecClass();
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$, lay);
        /*
            perform node hiding here...
         */
        let nodeOfInterest = pNode + '/' + cNode; // make the key for new objectProperty (Manufacturer/Legislation)
        let rootNode = this.myDiagram.findNodeForKey(1); // root node..
        // console.log(nodeOfInterest); // DEBUG-CHECK
        let objJson = this.config['viewStructure']['objectproperties']; // for easy iteration and parsing.
        for (let eachKey in objJson) {
            if (objJson.hasOwnProperty(eachKey)) {
                if (objJson[eachKey]['concept']['translatedURL'] === nodeOfInterest) { // find the node of interest
                    if (objJson[eachKey]['hasHiddenDirectParent']) { // check if the parent is hidden
                        rootNode.findLinksOutOf().each(eachLink => {
                            if (eachLink.toNode.data.text === nodeOfInterest) { // create the dashed line
                                eachLink.path.strokeDashArray = [4, 4];

                            }
                        });
                    }
                }
            }
        }
        this.myDiagram.model.setDataProperty(rootNode, 'strokeDashArray', [4, 4]); // set the dashed line in Diagram
        // console.log('currentSelections in New Config', this.config['currentSelections']); // previous selections from server
        for (let eachPreviousSelection of this.config['currentSelections']) { // add them again for reuse
            this.selectedProperties.push(eachPreviousSelection.pop());
        }
        if (this._nodeKeysBackup.length > 0) { // find the node keys for previous selection and make them visible (selected)
            for (let eachNodeKey of this._nodeKeysBackup) {
                let nodeToBeSelected = this.myDiagram.findNodeForKey(eachNodeKey);
                nodeToBeSelected.part.isSelected = true;
                nodeToBeSelected.selectionAdorned = true;
            }
        }
        this.tableJSON['parametersIncludingPath'] = this._tableJSONPaths; // store back the previous paths
        // console.log(this.myDiagram.selection.count); // DEBUG_CHECK (should match the previous selection count)
        // console.log(this.selectedProperties); // DEBUG_CHECK
    }
    negotiation(): void {

        this.router.navigate(['/simple-search-details',
          { queryParams: {catalogueId: this._negotiation_catalogue_id, id: this._negotiation_id} }]);
    }
}
