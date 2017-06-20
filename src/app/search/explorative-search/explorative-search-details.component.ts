/**
 * This file takes care of the details of Visualization
 * of the Data (JSON) that will be received from Backend
 */
import { Component, AfterViewInit, ViewChild , ElementRef } from '@angular/core';
// import { KeysPipe } from './pipes/keys'; 
import * as go from 'gojs';

@Component({
    selector: 'explore-search-details',
    template: `<div class="displayArea" #myDiagramDiv style="height:450px; width: 100%; position: relative;"></div>`,
    styles: [`.displayArea {background-color: lightgrey;}`],
})


export class ExplorativeSearchDetailsComponent extends AfterViewInit {

    // GoJS div as mentioned above in the @Component `template` param
    @ViewChild('myDiagramDiv') div: ElementRef;

    ngAfterViewInit(): void {
        /**
         * This code is taken from https://github.com/musale/angular-gojs-test
         * and changed for testing purposes
         */
        // create a make type from go namespace and assign it to MAKE
        const MAKE = go.GraphObject.make;

        // get the div in the HTML file
        const diagramDiv = this.div.nativeElement;

        // instatiate MAKE with Diagram type and the diagramDiv
        const myDiagram =
            MAKE(go.Diagram, diagramDiv,
                {
                    initialContentAlignment: go.Spot.Center, // center Diagram contents
                    'undoManager.isEnabled': true, // enable Ctrl-Z to undo and Ctrl-Y to redo
                    layout: MAKE(go.TreeLayout, // specify a Diagram.layout that arranges trees
                        { angle: 90, layerSpacing: 35 })
                });

        // the template we defined earlier
        myDiagram.nodeTemplate =
            MAKE(go.Node, 'Horizontal',
                { background: '#DD4814' },
                MAKE(go.TextBlock, 'Default Text',
                    { margin: 12, stroke: 'white', font: 'bold 16px sans-serif' },
                    new go.Binding('text', 'name'))
            );

        // define a Link template that routes orthogonally, with no arrowhead
        myDiagram.linkTemplate =
            MAKE(go.Link,
                { routing: go.Link.Orthogonal, corner: 5 },
                MAKE(go.Shape, { strokeWidth: 3, stroke: '#555' })); // the link shape

        let model = MAKE(go.TreeModel);
        model.nodeDataArray =
            [
                { key: '1',              name: 'Keyword' },
                { key: '2', parent: '1', name: 'Property1' },
                { key: '3', parent: '1', name: 'Property2' },
                { key: '4', parent: '3', name: 'Property3' },
                { key: '5', parent: '3', name: 'Property4' },
                { key: '6', parent: '2', name: 'Property5'}
            ];
        myDiagram.model = model;

    }
}
