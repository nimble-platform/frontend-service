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
    private hiddenElement: boolean = false;
    /*GOJS Variables*/
    private myDiagram: go.Diagram;
    private $ = go.GraphObject.make;
    /*Parameters that will be passed to `explorative-search-filter.component (Child)*/
    filterQueryRoot: string;
    filterQueryRootUrl: string;
    filterQuery: string;
    nodeFilterName: string;
    filterJSON: Object;
    /* To store selected properties*/
    private selectedProperties: Array<string> = [];

    private sparqlSelectedOption: Object;
    private tableJSON: Object = {};

    /*Final Data to be sent back to parent for processing.. Maybe..*/
    finalSelectionJSON: Object;

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
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$);
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
                'animationManager.isEnabled': false,
                'allowVerticalScroll': false
            });
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
                    toolTip: commonToolTip
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
                    new go.Binding('text'))
            );

        // this is the root node, at the center of the circular layers
        this.myDiagram.nodeTemplateMap.add('Root',
            this.$(go.Node, 'Auto',
                {
                    locationSpot: go.Spot.Center,
                    selectionAdorned: false,
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
    }

    /**
     * nodeClicked: function handles the click feature for GoJS
     * @param ev : event parameter
     * @param node: node entity
     */
    nodeClicked(ev, node): void {

        let rootConcept = node.findTreeRoot().data.text;
        let clickedNode = node.data.text; // name of the clicked node
        let rootConceptUrl = this.config['concept']['url'];
        let nodeConceptUrl;
        for (let eachDatProp of this.config['dataproperties']) {
            if (eachDatProp['translatedURL'] === clickedNode) {
                let index = this.config['dataproperties'].indexOf(eachDatProp);
                nodeConceptUrl = this.config['dataproperties'][index]['url'];
            }
        }
        // get values to be passed to child....
        this.nodeFilterName = clickedNode;
        this.filterQuery = nodeConceptUrl;
        this.filterQueryRoot = rootConcept;
        this.filterQueryRootUrl = rootConceptUrl;
        // build the Query Parameter
        let filteringInput = { 'concept': encodeURIComponent(rootConceptUrl.trim()),
            'property': encodeURIComponent(nodeConceptUrl.trim()), 'amountOfGroups': 3
            , 'language': this.lang};

        // MULTISELECTION via GOJS Library
        if (ev.control) { // if the CTRL Key is pressed..
            console.log('CTRL key pressed.. Multiselect On');
            if (node.isSelected) { // if the particular node is selected add to list
                // avoid duplicate entries in the list
                if (!this.selectedProperties.find( e => e === nodeConceptUrl)) {
                    this.selectedProperties.push(nodeConceptUrl);
                    // call the respective API...
                    this.expSearch.getPropertyValues(filteringInput)
                        .then(res => this.filterJSON = res);
                }
            } else { // the node was clicked again and deselected remove from list
                let index = this.selectedProperties.indexOf(nodeConceptUrl);
                if (index > -1) {
                    this.selectedProperties.splice(index, 1);
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
                        .then(res => this.filterJSON = res);
                }
            } else { // if the node is deselected remove if from list
                let index = this.selectedProperties.indexOf(nodeConceptUrl);
                if (index > -1) {
                    this.selectedProperties.splice(index, 1);
                    // do not send anything to child.. Remove the Filter from display
                    this.filterJSON = {};
                }
            }
        }
        console.log(this.selectedProperties);
        // if all properties deselected
        if (this.selectedProperties.length === 0) {
            this.tableResult = {};
        }

        // console.log(rootConceptUrl, nodeConceptUrl); // DEBUG --CHECK
    }
    /**
     * genTable: Generate a Dynamic tableJSON query for the API Call and
     * store result in tableResult Variable
     */
    genTable(): void {
        if (this.finalSelectionJSON) {
            this.tableJSON['concept'] = encodeURIComponent(this.finalSelectionJSON['root']);
            this.tableJSON['parameters'] = new Array();
            // for (let eachFilProp of this.finalSelectionJSON['filter']) {
            //    this.tableJSON['parameters'].push(encodeURIComponent(eachFilProp['property']));
            // }
            for (let eachSelectedProp of this.selectedProperties) {
                this.tableJSON['parameters'].push(encodeURIComponent(eachSelectedProp));
            }
            this.tableJSON['filters'] = new Array();
            for (let eachFilVal of this.finalSelectionJSON['filter']) {
                this.tableJSON['filters'].push({'min': eachFilVal['values'][0], 'max': eachFilVal['values'][1]});
            }
        } else { // if user directly clicks on the Search button
            this.tableJSON['concept'] = encodeURIComponent(this.filterQueryRootUrl);
            this.tableJSON['parameters'] = new Array();
            for (let eachSelectedProp of this.selectedProperties) {
                this.tableJSON['parameters'].push(encodeURIComponent(eachSelectedProp));
            }
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
        console.log('returned JSON', this.finalSelectionJSON);
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

    reloadRadialGraph(): void {
        let recApproach = new RecClass();
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$);
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
    names: string[] = []; // store the Strings from the JSON
    /**
     * generateGraphRecApproach : Rercusively generate graphs from the incoming JSON config
     * @param cnf : Incoming JSON config from Parent Component
     * @param myDiagram: Diagram parameter for GoJS
     * @param $: Make function for GoJS
     */
    public generateGraphRecApproach(cnf: any, myDiagram: any, $: any): void {
        // get a Tree structure of the incoming JSON
        let linkedOntTree = this.recursionParseJson(cnf);
        // console.log('Complete Tree:\n' + JSON.stringify(linkedOntTree)); // --> DEBUG
        let nodeDataArray: any = []; // Create an Array of Nodes for GoJS.
        for (let i = 1; i < this.names.length + 1; i++) {
            nodeDataArray.push({ key: i, text: this.names[i - 1], color: go.Brush.randomColor(128, 240) });
        }
        // Create The Links to Each node in the Tree with Recursion
        let linkDataArray: any = this.recursionLink(linkedOntTree);
        // console.log('LinkedDataList: ' + JSON.stringify(linkDataArray)); // --> DEBUG

        // Diagram Layout..
        myDiagram.layout = $(RadialLayout, {
            maxLayers: 2,
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
        this.names.push(jsonNode['concept']['translatedURL']);
        node.id = this.names.length;

        // Adding Attributes
        for (let eachDatProp of jsonNode.dataproperties) {
            this.names.push(eachDatProp.translatedURL);
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
            linkedDataArray.push({ from: linkedOntTree.id, to: attr });
        }

        for (let child of linkedOntTree.children) {
            linkedDataArray.push({ from: linkedOntTree.id, to: child.id });
            let childrenJson = this.recursionLink(child);
            childrenJson.forEach(element => {
                linkedDataArray.push(element);
            });
        }

        return linkedDataArray;
    }
}
