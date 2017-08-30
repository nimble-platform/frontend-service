/**
 * Creating of tree for visualizing data on diagram
 */
import * as go from 'gojs';
import { RadialLayout } from '../layout/RadialLayout';


/**
 * class OntNode
 * A Node structure for Binary Tree of the complete Data obtained from server
 */
export class OntNode {
    public id: number; // ID of the node
    public attr: any[] = []; // Array of all attributes connected to the node
    public children: OntNode[] = []; // Check for Nodes with Children
}

/**
 * Recursion Class for generating the Graph
 */
export class RecClass {
    private names: any[] = []; // store the Strings from the JSON
    /**
     * generateGraphRecApproach : Rercusively generate graphs from the incoming JSON config
     * @param cnf : JSON config from Parent Component
     * @param myDiagram: Diagram parameter for GoJS
     * @param $: Make function for GoJS
     * @param layerCount: How many layers to plot
     */
    public generateGraphRecApproach(cnf: any, myDiagram: any, $: any, layerCount: number): void {
        // get a Tree structure of the incoming JSON
        let linkedOntTree = this.recursionParseJson(cnf['viewStructure']);
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
            rotateNode: function (node: any, angle: any) {
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
        for (let eachDatProp of jsonNode['dataproperties']) {
            this.names.push({name: eachDatProp['translatedURL'], color: 'green'});
            node.attr.push(this.names.length);
        }

        // Adding Children
        for (let childKey in jsonNode['objectproperties']) {
            if (jsonNode['objectproperties'].hasOwnProperty(childKey)) {
                // console.log(childKey); // --> DEBUG
                // console.log(jsonNode['objectproperties'][childKey]);
                node.children.push(this.recursionParseJson(jsonNode['objectproperties'][childKey]));
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
