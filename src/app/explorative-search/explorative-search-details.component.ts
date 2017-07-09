/**
 * This file takes care of the details of Visualization
 * of the Data (JSON) that will be received from Backend
 */

import { Component, AfterViewInit, ViewChild , ElementRef, Input, OnChanges } from '@angular/core';
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

    @Input() config: Object;
    // GoJS div as mentioned above in the @Component `template` param
    @ViewChild('myDiagramDiv') div: ElementRef;
    // private localTemp: any;
    private myDiagram: go.Diagram;
    private $ = go.GraphObject.make;
    filterQuery: string;
    filterJSON: Object;

    constructor(private  expSearch: ExplorativeSearchService) { }

    /**
     * using OnChanges LifeCycle Hook for incoming Configuration
     * from the Parent Component
     */

    ngOnChanges(): void {
        if (!this.config) { return; }

        let recApproach = new RecClass();
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$);
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
      'animationManager.isEnabled': true,
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

    nodeClicked(e, node): void {
        // console.log(node.findTreeRoot().data.text, node.data.text);
        let rootConcept = node.findTreeRoot().data.text;
        let clickedNode = node.data.text;
        this.filterQuery = clickedNode;
        let filteringInput = {'concept': rootConcept, 'property': clickedNode, 'amountOfGroups': 3};
        // console.log(JSON.stringify(filteringInput));
         this.expSearch.getPropertyValues(filteringInput)
            .then(
                res => this.filterJSON = res
            );
    }
}


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
        // console.log('Complete Tree:\n' + JSON.stringify(linkedOntTree)); --> DEBUG
        let nodeDataArray: any = []; // Create an Array of Nodes for GoJS.
        for (let i = 1; i < this.names.length + 1; i++ ) {
            nodeDataArray.push({key: i, text: this.names[i - 1], color: go.Brush.randomColor(128, 240) });
        }
        // Create The Links to Each node in the Tree with Recursion
        let linkDataArray: any = this.recursionLink(linkedOntTree);
        // console.log('LinkedDataList: ' + JSON.stringify(linkDataArray)); --> DEBUG
        // Diagram Layout..
        myDiagram.layout = $(RadialLayout, {
            maxLayers: 2,
            rotateNode: function(node: any, angle: any, sweep: any, radius: any) {
                // rotate the nodes and make sure the text is not upside-down
                node.angle = angle;
                let label = node.findObject('TEXTBLOCK');
                if (label !== null) {
                    label.angle = ((angle > 90 && angle < 270 || angle < -90) ? 180 : 0);
                }
            },
            commitLayers: function() {
                // optional: add circles in the background
                // need to remove any old ones first
                let diagram = this.diagram;
                let gridlayer = diagram.findLayer('Grid');
                let circles = new go.Set(go.Part);
                gridlayer.parts.each((circle: any) => {
                    if (circle.name === 'CIRCLE') { circles.add(circle); }
                });
                circles.each(function(circle) {
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
        this.names.push(jsonNode['concept']);
        node.id = this.names.length;

        // Adding Attributes
        for (let eachDatProp of jsonNode.dataproperties) {
            this.names.push(eachDatProp);
            node.attr.push(this.names.length);
        }

        // Adding Children
        for (let childKey in jsonNode.objectproperties) {
            if (jsonNode.objectproperties.hasOwnProperty(childKey)) {
                // console.log(childKey); --> DEBUG
                node.children.push(this.recursionParseJson(jsonNode.objectproperties[childKey]));
            }
        }

        // console.log('Finished recFunc created node: ' + node.id); --> DEBUG
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
            linkedDataArray.push({from: linkedOntTree.id, to: attr});
        }

        for (let child of linkedOntTree.children) {
            linkedDataArray.push({from: linkedOntTree.id, to: child.id});
            let childrenJson = this.recursionLink(child);
            childrenJson.forEach(element => {
                linkedDataArray.push(element);
            });
        }

        return linkedDataArray;
    }
}


