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
import { RadialLayout } from './layout/RadialLayout';
import { ExplorativeSearchService } from './explorative-search.service';


@Component({
    selector: 'explore-search-details',
    templateUrl: './explorative-search-details.component.html',
    styleUrls: ['./explorative-search-details.component.css'],
    providers: [ExplorativeSearchService]
})


export class ExplorativeSearchDetailsComponent implements AfterViewInit, OnChanges {

    @Input() config: Object; // this comes from `explorative-search-form.component` (Parent)
    @Input() lang: string; // language selection hack
    // GoJS div as mentioned above in the @Component `template` param
    @ViewChild('myDiagramDiv') div: ElementRef;
    private hiddenElement: boolean = false; // to hide the graph or table
    /*GOJS Variables*/
    private myDiagram: go.Diagram;
    private $ = go.GraphObject.make;
    /*Parameters that will be passed to `explorative-search-filter.component (Child)*/
    arrayPassedToChild: any[] = []; // this is passed to the child NOW
    filterQueryRoot: string;
    filterQueryRootUrl: string;
    filterQuery: string;
    nodeFilterName: string;
    filterJSON: Object;
    /* To store selected properties*/
    private selectedProperties: Array<string> = [];

    private sparqlSelectedOption: Object;
    private tableJSON: Object = {};
    private collectionOfFiltersFromChildren: any[] = [];

    /*Final Data to be sent back to parent for processing.. Maybe..*/
    public finalSelectionJSON: Object;

    /*The API response from tableJSON will be stored in tableResult*/
    tableResult: any;

    constructor(private expSearch: ExplorativeSearchService) { }

    /**
     * using OnChanges LifeCycle Hook for incoming Configuration
     * from the Parent Component
     */
    ngOnChanges(): void {
        if (!this.config) { return; }
        // console.log(JSON.stringify(this.config)); // DEBUG -CHECK
        let recApproach = new RecClass();
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$, 2);
        // this.resetSelection();
        this.selectedProperties = [];
        this.tableResult = {};
        this.filterJSON = {};
        this.filterQueryRoot = '';
        this.filterQueryRootUrl = '';
        this.filterQuery = '';
        this.nodeFilterName = '';
    }

    /**
     * AfterViewInit LifeCycle Hook for diagram initialization for GoJS
     */
    ngAfterViewInit(): void {
        this.myDiagram = this.$(go.Diagram, this.div.nativeElement,
            {
                initialContentAlignment: go.Spot.Center,
                padding: 10,
                isReadOnly: true,
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
                    selectionAdorned: true,
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
            console.log('Selection Change occured');
            console.log('Selection Count ', e.diagram.selection.count);
            if (e.diagram.selection.count === 0) { // if in non Multiselect if all selections removed
                // reset all
                this.selectedProperties = [];
                this.tableJSON = {};
                this.tableResult = {};
                this.filterJSON = {};
                this.filterQueryRoot = '';
                // this.filterQueryRootUrl = '';
                this.filterQuery = '';
                this.nodeFilterName = '';
                if (this.finalSelectionJSON === undefined) {
                    // make the JSON
                    this.finalSelectionJSON = {'root': this.filterQueryRootUrl, 'filter': []};
                    console.log('Hardcode selection', this.finalSelectionJSON);
                } else {
                    if (this.finalSelectionJSON['filter'].length > 0) {
                        this.finalSelectionJSON['filter'] = [];
                    }
                }
                this.arrayPassedToChild = [];
                this.collectionOfFiltersFromChildren = [];
            }
            });
    }


    /**
     * nodeClicked: function handles the click feature for GoJS
     * @param ev : event parameter
     * @param node: node entity
     */
    nodeClicked(ev, node): void {
        let jsonFilterForEachChild = {};
        let rootConcept = node.part.findTreeRoot().data.text;
        let clickedNode = node.part.data.text; // name of the clicked node
        let rootConceptUrl = this.config['concept']['url'];
        let nodeConceptUrl;
        for (let eachDatProp of this.config['dataproperties']) {
            if (eachDatProp['translatedURL'] === clickedNode) {
                let index = this.config['dataproperties'].indexOf(eachDatProp);
                nodeConceptUrl = this.config['dataproperties'][index]['url'];
            }
        }
        console.log('layername', node.part.layerName);
        if (node.part.layerName === 'red') { // OBJECT Property Clicked
            this.objPropertyDetails(node);
        } else {
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
            // MULTISELECTION via GOJS Library
            if (ev.control) { // if the CTRL Key is pressed..
                console.log('CTRL key pressed.. Multiselect On');
                if (node.isSelected) { // if the particular node is selected add to list
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
                                    console.log('jsonFilterForChild ', jsonFilterForEachChild);
                                    console.log('arrayPassedToChild ', this.arrayPassedToChild);
                                }, 500);
                            });
                    }
                } else { // the node was clicked again and deselected remove from list
                    let index = this.selectedProperties.indexOf(nodeConceptUrl);
                    if (index > -1) {
                        this.selectedProperties.splice(index, 1);
                        this.arrayPassedToChild.splice(index, 1); // they were pushed at the same index
                        // do not send anything to child .. Remove the Filter from display
                        this.filterJSON = {};
                    }
                }
            } else { // no CTRL Button pressed but node selected
                console.log('CTRL key released.. Multiselect off');
                if (node.isSelected) { // if node is selected add to list
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
                                    console.log('jsonFilterForChild ', jsonFilterForEachChild);
                                    console.log('arrayPassedToChild ', this.arrayPassedToChild);
                                }, 500);
                            });
                    }
                } // if the node is deselected remove if from list via selection count = 0 for GoJS
            }
            console.log(this.selectedProperties);
            // if all properties deselected
            if (this.selectedProperties.length === 0) {
                this.tableResult = {};
            }
            // console.log(rootConceptUrl, nodeConceptUrl); // DEBUG --CHECK
        }
    }
    objPropertyDetails(node: any): void {
        let immediateParentNode = node.part.findTreeParentNode().data.text;
        let clickedNode = node.part.data.text;
        console.log('My Parent is..', immediateParentNode);
        console.log('Me: ', clickedNode);
        for (let eachObjPropKey in this.config['objectproperties']) {
            if (this.config['objectproperties'].hasOwnProperty(eachObjPropKey)) {
                if (this.config['objectproperties'][eachObjPropKey]['concept']['translatedURL'] === immediateParentNode) {
                    // console.log(this.config['objectproperties'][eachObjPropKey]['objectproperties']);
                    for (let eachKeyWithinObjProp in this.config['objectproperties'][eachObjPropKey]['objectproperties']) {
                        if (this.config['objectproperties'][eachObjPropKey]['objectproperties'].hasOwnProperty(eachKeyWithinObjProp)) {
                            if (clickedNode === this.config['objectproperties'][eachObjPropKey]['objectproperties']
                                    [eachKeyWithinObjProp]['concept']['translatedURL']) {
                                // console.log(this.config['objectproperties'][eachObjPropKey]['objectproperties'][eachKeyWithinObjProp]);

                                // build JSON for query
                                let layerJSON = {
                                'concept': this.config['objectproperties'][eachObjPropKey]['objectproperties']
                                    [eachKeyWithinObjProp]['concept']['url'],
                                'language': this.lang,
                                'conceptURIPath': this.config['objectproperties'][eachObjPropKey]['objectproperties']
                                    [eachKeyWithinObjProp]['conceptURIPath'],
                                'stepRange': 1,
                                'frozenConcept':  this.config['objectproperties'][eachObjPropKey]['objectproperties']
                                    [eachKeyWithinObjProp]['frozenConcept'],
                                'distanceToFrozenConcept':  this.config['objectproperties'][eachObjPropKey]
                                    ['objectproperties'][eachKeyWithinObjProp]['distanceToFrozenConcept'],
                                'oldJsonLogicalView': this.config};
                                console.log('DYNAMIC JSON ', layerJSON);
                                this.expSearch.getLogicalView(layerJSON)
                                    .then(res =>
                                        this.config = res
                                    );
                                this.reloadRadialGraph(3);
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
        if (this.finalSelectionJSON) {
            this.tableJSON['concept'] = encodeURIComponent(this.filterQueryRootUrl);
            this.tableJSON['parameters'] = [];
            // for (let eachFilProp of this.finalSelectionJSON['filter']) {
            //    this.tableJSON['parameters'].push(encodeURIComponent(eachFilProp['property']));
            // }
            for (let eachSelectedProp of this.selectedProperties) {
                this.tableJSON['parameters'].push(encodeURIComponent(eachSelectedProp));
            }
            /*if (this.finalSelectionJSON['filter'].length > 0) {
                this.tableJSON['filters'] = [];
                for (let eachFilVal of this.finalSelectionJSON['filter']) { // push only selected property filters
                    if (this.selectedProperties.indexOf(eachFilVal['property']) > -1 ) {
                        this.tableJSON['filters'].push({'property': encodeURIComponent(eachFilVal['property']),
                            'min': eachFilVal['values'][0], 'max': eachFilVal['values'][1]});
                    }
                }
            }*/
            if (this.collectionOfFiltersFromChildren.length > 0) {
                this.tableJSON['filters'] = [];
                for (let eachFilter of this.collectionOfFiltersFromChildren) {
                    if (this.selectedProperties.indexOf(eachFilter['property']) > -1 ) {
                        this.tableJSON['filters'].push({'property': encodeURIComponent(eachFilter['property']),
                            'min': eachFilter['values'][0], 'max': eachFilter['values'][1]});
                    }
                }
            }else {
                this.tableJSON['filters'] = [];
            }
        } else { // if user directly clicks on the Search button
            console.log('user directly clicked on Search');
            this.tableJSON['concept'] = encodeURIComponent(this.filterQueryRootUrl);
            this.tableJSON['parameters'] = [];
            for (let eachSelectedProp of this.selectedProperties) {
                this.tableJSON['parameters'].push(encodeURIComponent(eachSelectedProp));
            }
            console.log('filters after direct click', this.tableJSON['filters']);
        }
        this.tableJSON['language'] = this.lang;
        console.log(this.tableJSON);
        this.expSearch.getTableValues(this.tableJSON)
            .then(res => this.tableResult = res)
            .catch(err => console.log(err));
    }

    /**
     * Data from the Child's Event Emitter
     * @param finalSelectionJSON same name as the child's variable
     */
    handleFilterSelectionUpdated(finalSelectionJSON) {
        this.finalSelectionJSON = finalSelectionJSON;
        if (this.finalSelectionJSON['filter'].length > 0) {
            this.collectionOfFiltersFromChildren.push(this.finalSelectionJSON['filter'][0]);
            console.log('collection of filters: ', this.collectionOfFiltersFromChildren);
        } else if (this.finalSelectionJSON['filter'].length === 0) {
            this.collectionOfFiltersFromChildren.forEach(el => {
                if (el['property'] === this.finalSelectionJSON['child']) {
                    let indexToRemove = this.collectionOfFiltersFromChildren.indexOf(el);
                    this.collectionOfFiltersFromChildren.splice(indexToRemove, 1);
                    console.log('filter Removed');
                }
            });
        }
        console.log('returned JSON ', this.finalSelectionJSON);
    }

    getSparqlOptionalSelect(indexInp: number) {
        console.log(indexInp);
        // need URI component in order to send url as JSON.stringify
        let optSelectJSON = {'uuid': encodeURIComponent(this.tableResult.uuids[indexInp].trim())};
        optSelectJSON['language'] = this.lang;
        console.log(optSelectJSON);
        this.expSearch.getOptionalSelect(optSelectJSON)
          .then(res => this.sparqlSelectedOption = res );
        this.hiddenElement = true;
    }

    diagramAgain(): void {
        // this.sparqlSelectedOption = null;
        if (this.hiddenElement) {
            this.hiddenElement = false;
        } else {
            this.hiddenElement = true;
        }
    }

    reloadRadialGraph(lay: number): void {
        // this.myDiagram.layout.maxLayers = lay;
        let recApproach = new RecClass();
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$, lay);
    }
}



/**
 * Creating of tree for visualizing data on diagram
 */

/**
 * class OntNode
 * A Node structure for Binary Tree of the complete Data obtained from server
 */
class OntNode {
    public id: number; // ID of the node
    public attr: any[] = []; // Array of all attributes connected to the node
    public children: OntNode[] = []; // Check for Nodes with Children
}

/**
 * Recursion Class for generating the Graph
 */
class RecClass {
    names: any[] = []; // store the Strings from the JSON
    /**
     * generateGraphRecApproach : Rercusively generate graphs from the incoming JSON config
     * @param cnf : JSON config from Parent Component
     * @param myDiagram: Diagram parameter for GoJS
     * @param $: Make function for GoJS
     */
    public generateGraphRecApproach(cnf: any, myDiagram: any, $: any, layerCount: number): void {
        // get a Tree structure of the incoming JSON
        let linkedOntTree = this.recursionParseJson(cnf);
        // console.log('Complete Tree:\n' + JSON.stringify(linkedOntTree)); // --> DEBUG
        let nodeDataArray: any = []; // Create an Array of Nodes for GoJS.
        for (let i = 1; i < this.names.length + 1; i++) {
            nodeDataArray.push({ key: i, text: this.names[i - 1]['name'], color: this.names[i - 1]['color'] });
        }
        // Create The Links to Each node in the Tree with Recursion
        let linkDataArray: any = this.recursionLink(linkedOntTree);
        // console.log('LinkedDataList: ' + JSON.stringify(linkDataArray)); // --> DEBUG

        // Diagram Layout..
        myDiagram.layout = $(RadialLayout, {
            maxLayers: layerCount,
            // layerThickness: 150, for node spreading
            rotateNode: function (node: any, angle: any, sweep: any, radius: any) {
                // rotate the nodes and make sure the text is not upside-down
                node.angle = angle;
                let label = node.findObject('TEXTBLOCK');
                if (label !== null) {
                    label.angle = ((angle > 90 && angle < 270 || angle < -90) ? 180 : 0);
                }
            },
            commitLayers: function () {
                // optional: add circles in the background
                // need to remove any old ones first
                let diagram = this.diagram;
                let gridlayer = diagram.findLayer('Grid');
                let circles = new go.Set(go.Part);
                gridlayer.parts.each((circle: any) => {
                    if (circle.name === 'CIRCLE') { circles.add(circle); }
                });
                circles.each(function (circle) {
                    diagram.remove(circle);
                });
                // add circles centered at the root
                // let $ = go.GraphObject.make;  // for conciseness in defining templates
                for (let lay = 1; lay <= this.maxLayers; lay++) {
                    let radius = lay * this.layerThickness;
                    let circle =
                        $(go.Part,
                            { name: 'CIRCLE', layerName: 'Grid' },
                            { locationSpot: go.Spot.Center, location: this.root.location },
                            $(go.Shape, 'Circle',
                                { width: radius * 2, height: radius * 2 },
                                { fill: 'rgba(200,200,200,0.2)', stroke: null }));
                    diagram.add(circle);
                }
            }
        });

        // Use the Lists to Create the Radial Layout...
        myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
        // For Determining the Root of the Diagram
        let centerPoint = nodeDataArray[0];
        let rootNode = myDiagram.findNodeForData(centerPoint);
        let rootDiagram = rootNode.diagram;
        rootNode.category = 'Root';
        rootDiagram.layoutDiagram(true);
    }

    /**
     * recursionParseJson: returns a Tree of all the nodes from the JSON data
     * @param jsonNode JSON value from the Parent Component
     * @returns {OntNode}
     */

    private recursionParseJson(jsonNode: any): any {
        let node = new OntNode();

        // Adding node name
        this.names.push({name: jsonNode['concept']['translatedURL'], color: 'red'});
        node.id = this.names.length;

        // Adding Attributes
        for (let eachDatProp of jsonNode.dataproperties) {
            this.names.push({name: eachDatProp.translatedURL, color: 'green'});
            node.attr.push(this.names.length);
        }

        // Adding Children
        for (let childKey in jsonNode.objectproperties) {
            if (jsonNode.objectproperties.hasOwnProperty(childKey)) {
                // console.log(childKey); // --> DEBUG
                node.children.push(this.recursionParseJson(jsonNode.objectproperties[childKey]));
            }
        }

        // console.log('Finished recFunc created node: ' + node.id); // --> DEBUG
        return node;
    }

    /**
     * recursionLink: Create Links using Recursion for the Tree
     * @param linkedOntTree return value from recursionParseJson
     * @returns an Array of Link Information
     */
    private recursionLink(linkedOntTree: any): any {
        let linkedDataArray: any = [];

        for (let attr of linkedOntTree.attr) {
            linkedDataArray.push({ from: linkedOntTree.id, to: attr});
        }

        for (let child of linkedOntTree.children) {
            linkedDataArray.push({ from: linkedOntTree.id, to: child.id});
            let childrenJson = this.recursionLink(child);
            childrenJson.forEach(element => {
                linkedDataArray.push(element);
            });
        }

        return linkedDataArray;
    }
}
