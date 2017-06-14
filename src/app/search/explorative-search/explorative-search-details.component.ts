import { Component, AfterViewInit, ViewChild , ElementRef } from '@angular/core';
import { ExplorativeSearchFormComponent } from './explorative-search-form.component';
// GoJS var
declare var go: any;

@Component({
    selector: 'explore-search-details',
    template: `<div #myDiagramDiv style="width:100%; height: 450px;"></div>`,
})

export class ExplorativeSearchDetailsComponent extends AfterViewInit {
    // GoJS div
    @ViewChild('myDiagramDiv') div: ElementRef;
    constructor(private formComponent: ExplorativeSearchFormComponent) {
        super();
    }
    ngAfterViewInit(): void {
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
        myDiagram.nodeTemplate = MAKE(go.Node, 'Horizontal',
                { background: '#DD4814' },
                MAKE(go.TextBlock, 'Default Text',
                    { margin: 12, stroke: 'white', font: 'bold 16px sans-serif' },
                    new go.Binding('text', 'name')));

        // define a Link template that routes orthogonally, with no arrowhead
        myDiagram.linkTemplate = MAKE(go.Link,
                { routing: go.Link.Orthogonal, corner: 5 },
                MAKE(go.Shape, { strokeWidth: 3, stroke: '#555' })); // the link shape

        let model = MAKE(go.TreeModel);
        model.nodeDataArray = [
                { key: '1',              name: 'Don Meow' },
                { key: '2', parent: '1', name: 'Roquefort' },
                { key: '3', parent: '1', name: 'Toulouse'},
                { key: '4', parent: '3', name: 'Peppo'},
                { key: '5', parent: '3', name: 'Alonzo'},
                { key: '6', parent: '2', name: 'Berlioz'}];
        myDiagram.model = model;
        console.log(JSON.stringify(this.formComponent.Output));
    }
}
