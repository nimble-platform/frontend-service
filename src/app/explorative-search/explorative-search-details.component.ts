/**
 * This file takes care of the details of Visualization
 * of the Data (JSON) that will be received from Backend
 * It also sends data to the filter attributes of the Nodes.
 *
 * Parent of this Component: explorative-search-form.component
 * Child of this component: explorative-search-filter.component
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

    @Input() config: Object; // this comes from `explorative-search-form.component` (Parent)
    // GoJS div as mentioned above in the @Component `template` param
    @ViewChild('myDiagramDiv') div: ElementRef;
    /*GOJS Variables*/
    private myDiagram: go.Diagram;
    private $ = go.GraphObject.make;
    /*Parameters that will be passed to `explorative-search-filter.component (Child)*/
    filterQueryRoot: string;
    filterQuery: string;
    filterJSON: Object;
    /* To store selected properties*/
	private selectedProperties : Array<string> =[]; 
	keywordCounter = 0;

    /*To store filters*/
    private lala :Object
    private selectedFilters : Array<string> =[]; 
	filterCounter = -1;

    /**tableJSON = {'concept': 'HighChair', 'parameters':
    *    ['hasHeight', 'hasWidth'],
     *   'filters': [{'min': 3.0, 'max': 5.2}]};
	*/	
	tableJSON = "";

    /*Final Data to be sent back to parent for processing.. Maybe..*/
    finalSelectionJSON: Object;
	
    /*The API response from tableJSON will be stored in tableResult*/
    tableResult: any;

    constructor(private  expSearch: ExplorativeSearchService) { }

    /**
     * using OnChanges LifeCycle Hook for incoming Configuration
     * from the Parent Component
     */

    ngOnChanges(): void {
        if (!this.config) { return; }
        // this.tableResult = null;
        let recApproach = new RecClass();
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$);
        this.resetSelection();
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

    /**
     * nodeClicked: function handles the click feature for GoJS
     * @param e : event parameter
     * @param node: node entity
     */
    nodeClicked(e, node): void {
        /**
         * MULTISELECT STILL REMAINING
         */
        // console.log(node.findTreeRoot().data.text, node.data.text); DEBUG
        console.log("Multitoach: " + e.isMultiTouch);
        let rootConcept = node.findTreeRoot().data.text;
        let clickedNode = node.data.text; // name of the clicked node
        this.filterQuery = clickedNode; // pass it to the child component
        this.filterQueryRoot = rootConcept; // pass this to the child component
        // create a JSON for the API call
        let filteringInput = {'concept': rootConcept, 'property': clickedNode, 'amountOfGroups': 3};
		 console.log("Concept: " + rootConcept); // DEBUG CHECK#
		  console.log("Property: " + clickedNode); // DEBUG CHECK#
		  let contained = false;
           for (var item of this.selectedProperties) {
            if (item === clickedNode){
                contained = true;
            }
           }
          if (contained==false){
          this.selectedProperties[this.keywordCounter] = clickedNode;
		  this.keywordCounter = this.keywordCounter +1;
          }
		  for (var item of this.selectedProperties) {
			    console.log(item); // 9,2,5
			}
			this.tableJSON = "{\"concept\": \""+ rootConcept +"\", \"parameters\":[ ";
			 for (var item of this.selectedProperties) {
			    this.tableJSON+= "\"" + item + "\", ";
			    console.log(item); // 9,2,5
			}
			this.tableJSON = this.tableJSON.substring(0, this.tableJSON.length-2);
			this.tableJSON += "],\"filters\": []}";
			console.log(this.tableJSON );
		  /**
		  *tableJSON = {'concept': 'HighChair', 'parameters':
        ['hasHeight', 'hasWidth'],
        'filters': [{'min': 3.0, 'max': 5.2}]};
		  *
		  */
        // console.log(JSON.stringify(filteringInput)); DEBUG
        // API Call and store the value
        let temp = "";
        this.filterCounter++;
         this.expSearch.getPropertyValues(filteringInput)
         .then(res => this.filterJSON = res)
          .then(res => this.lala = res)
          .then (res => this.selectedFilters[this.filterCounter] =res)
            .then(function(res)
            {
                 console.log(res);
                 console.log(typeof res)
                 console.log("Counter: " + this.filterCounter)   

            }.bind(this)
                
            );
            
    }

/**
 * This method is used to clear the current selection of selected nodes
 */
resetSelection(): void{
    //clear data structures
    console.log("Before selection reset: " + this.selectedProperties);
	this.selectedProperties  =[];
	this.keywordCounter = 0;
    this.finalSelectionJSON = null;
    this.tableJSON="{}";
    console.log("After seelction reset: " + this.selectedProperties);
}


/**
 *  Create the filter text for the input json string for the webservice method to execute a SPARQL query against an ontology
 * @param index  default should be 0
 * @param finalSelection  the selction which was created if the user clicks on submit of a filter
 */
    createFilterText(index, finalSelection){
        if (finalSelection == null){
            return "";
        }
        if ( finalSelection["filter"].length > 0){
         let filter = finalSelection["filter"][index];
         let filterproperty = filter["property"];
         let values = filter["values"];
         
         let min = values[0];
         let max = values[1];

         let resultString = "{\"property\":\""+filterproperty+"\",\"min\":"+min+",\"max\":"+max+"}";
         return resultString;
        }
       
        return "";
    

    }


    /**
     * Add the filtertext to the input json string for the webservice method to execute a SPARQL query against an ontology
     * @param filterText String of the filter
     * @param inputJsonForSPARQLWebservice String containing the cocnept and the properties
     */
    addFilterTextToTableJson(filterText, inputJsonForSPARQLWebservice){
       let index = inputJsonForSPARQLWebservice.indexOf("filters\":");
       let resultString =inputJsonForSPARQLWebservice;
       if (index !== -1){
            resultString = inputJsonForSPARQLWebservice.substring(0, index + 11);
            resultString += filterText + "]}";
       }
    return resultString;

    }
    /**
     * Currently this function will call the hardcoded JSON (tableJSON)
     * to get the results for the TABLE display.
     */
    genTable(): void {
        this.tableResult=null;
        console.log(this.filterCounter);
       for (let i = 1; i <= this.filterCounter; i++ ) {

        console.log(this.selectedFilters[i])
       }
		

       
        let filter = this.createFilterText(0, this.finalSelectionJSON);
        this.tableJSON =this.addFilterTextToTableJson(filter, this.tableJSON);
        
        console.log("inputJsonForSPARQLSELECT: " + this.tableJSON);
       
        // call the API for table data
        this.expSearch.getTableValues(this.tableJSON)
            .then(
                // store the result in tableResult
                // which will be used in HTML file
                res => this.tableResult = res
				
            );
       
        let recApproach = new RecClass();
        recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$);
        this.resetSelection();
		 
    }

    handleFilterSelectionUpdated(finalSelectionJSON)
    {
        this.finalSelectionJSON = finalSelectionJSON;
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


