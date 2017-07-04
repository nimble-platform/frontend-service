/**
 * This file takes care of the details of Visualization
 * of the Data (JSON) that will be received from Backend
 * NOTE: Initial Implementation only displays the single Query.
 * Upon clicking the next query button -> there are errors.
 * The page needs to be refreshed for the next query
 */

import { Component, AfterViewInit, ViewChild , ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as go from 'gojs';
import { RadialLayout } from './layout/RadialLayout';

@Component({
    selector: 'explore-search-details',
    template: `<div class="displayArea" #myDiagramDiv></div>`,
    styleUrls: ['./explorative-search-form.component.css']
})


export class ExplorativeSearchDetailsComponent implements AfterViewInit, OnChanges {

    @Input() config: Object[];
    // GoJS div as mentioned above in the @Component `template` param
    @ViewChild('myDiagramDiv') div: ElementRef;

    private myDiagram: go.Diagram;
    private $ = go.GraphObject.make;

    constructor() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.config || this.config.length === 0) { return; }
        // console.log(JSON.stringify(changes));
        // console.log(JSON.stringify(this.config));
        this.generateGraph();
    }

    ngAfterViewInit(): void {
        this.myDiagram = this.$(go.Diagram, this.div.nativeElement,
    {
      initialContentAlignment: go.Spot.Center,
      padding: 10,
      isReadOnly: true,
      'animationManager.isEnabled': false
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
                selectionAdorned: false,
                click: this.nodeClicked,
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

    private generateGraph(): void {
        // Current Implementation shows only the figure for Single Query
        // need checks here..
        let names: string[] = [];
        for (let eachEntry of this.config) {
            names.push(eachEntry['concept']);
            for (let conceptName of eachEntry['dataproperties']){
                names.push(conceptName);
            }
        }
        // console.log(names);

        let nodeDataArray: any = [];
        for (let i = 0; i < names.length; i++ ) {
            nodeDataArray.push({key: i, text: names[i], color: go.Brush.randomColor(128, 240) });
        }
        let linkDataArray: any = [];
        for (let i = 0; i < nodeDataArray.length - 1; i++ ) {

            linkDataArray.push({from: 0, to: (i + 1), color: go.Brush.randomColor(0, 128) });
        }
        this.myDiagram.layout = this.$(RadialLayout, {
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
                    let $ = go.GraphObject.make;  // for conciseness in defining templates
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

     this.myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
     let centerPoint = nodeDataArray[0];
     let rootNode = this.myDiagram.findNodeForData(centerPoint);
     let rootDiagram = rootNode.diagram;
     rootNode.category = 'Root';
     rootDiagram.layoutDiagram(true);
    } // ngAfterViewInit ends..

    nodeClicked(e, root): void {
        console.log(root.data.text);
    }
}
