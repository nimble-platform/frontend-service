import {Component, AfterViewInit, Input, OnChanges, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import { ExplorativeSearchService } from './explorative-search.service';
import { Router } from '@angular/router';


export class Leaf {
    name: string;
    url: string;
    color: string;
    children: Leaf[] = [];
}

@Component({
    selector: 'explore-search-details',
    templateUrl: './explorative-search-details.component.html',
    styleUrls: ['./explorative-search-details.component.css'],
    providers: [ExplorativeSearchService],
    encapsulation: ViewEncapsulation.None
})


export class ExplorativeSearchDetailsComponent implements AfterViewInit, OnChanges {
    @Input() config: Object; // this comes from `explorative-search-form.component` (Parent)
    @Input() lang: string; // language selection which comes from the Parent
    private hiddenElement = false; // to hide the graph or table
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
    private _temp_path_Json = { urlOfProperty: '', path: []};
    private tableJSON: Object = {
        parametersIncludingPath: []
    };
    private _tableJSONPaths = []; // for storing Paths when the figure is rendered again..
    private collectionOfFiltersFromChildren: any[] = []; // filters from the Children Components
    private _optSelectJSON = {};
    private _negotiation_id;
    private _negotiation_catalogue_id;
    public negotiationEnable = false;

    /*Final Data to be sent back to parent for processing.*/
    finalSelectionJSON: Object;

    /*The API response from tableJSON will be stored in tableResult*/
    tableResult: any;

    private _error_detected_getProperties = false;
    private _error_detected_getLogicalView = false;
    private _error_detected_getSPARQLSelect = false;
    private _error_detected_getTableValues = false;
    private _warning_table_results = false;
    private _warning_selection = false;
    // BackEnd Service + Modal Service declared here
    constructor(private expSearch: ExplorativeSearchService, private router: Router) { }

    /**
     * using OnChanges LifeCycle Hook for incoming Configuration
     * from the Parent Component
     */
    ngOnChanges(): void {
        if (!this.config) { return; }
        console.log(this.config['viewStructure']); // DEBUG -CHECK
        // recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$, 2);
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
        this._warning_selection = false;
        d3.selectAll('svg > *').remove();
        this.ngAfterViewInit();
    }

    /**
     * AfterViewInit LifeCycle Hook for diagram initialization for GoJS
     */
    ngAfterViewInit(): void {
        const svg = d3.select('svg'),
            width = +svg.attr('width'),
            height = +svg.attr('height'),
            g = svg.append('g').attr('transform', 'translate(' + (width / 3 + 40) + ',' + (height / 3 + 140) + ')');

        const tree = d3.tree()
            .size([2 * Math.PI, 300])
            .separation(function(a, b) { return (a.parent === b.parent ? 1 : 2) / a.depth; });
        const root = tree(d3.hierarchy(this.parse_node(this.config['completeStructure'])));
        // root.children.forEach(collapse);
        // update(root);
        const link = g.selectAll('.link')
            .data(root.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', <any>d3.linkRadial()
                .angle(function(d) { return d['x']; })
                .radius(function(d) { return d['y']; }));

        const node = g.selectAll('.node')
            .data(root.descendants())
            .enter().append('g')
            .attr('class', function(d) { return 'node' + (d.children ? ' node--internal' : ' node--leaf'); })
            .attr('transform', function(d) { return 'translate(' + radialPoint(d.x, d.y) + ')'; })
            .on('click', click)
            .on('dblclick', dblclick);

        node.append('circle')
            .attr('r', 5)
            .style('fill', (d) => {
                if (d.data['color'] === 'green') {
                    return '#0f0';
                } else {
                    if (d.depth === 0) {
                        return '#999';
                    }
                    return '#f00';
                }
            });

        node.append('text')
            .attr('dy', '0.31em')
            .attr('x', function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
            .attr('text-anchor', function(d) { return d.x < Math.PI === !d.children ? 'start' : 'end'; })
            .attr('transform', function(d) {
                return 'rotate(' + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ')'; })
            .text(function(d) { return d.data['name']; });


        function radialPoint(x, y) {
            return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
        }


        function click(d) {
            d3.select(this).select('circle').transition()
                .duration(1000)
                .attr('r', 6);
        }

        function dblclick(d) {
            console.log(d.parent);
            d3.select(this).select('circle').transition()
                .duration(1000)
                .attr('r', 16);
        }
    }

    parse_node(jsonVal: any): any {
        let node = new Leaf();
        node.name = jsonVal.concept.translatedURL;
        node.url = jsonVal.concept.url;


        // adding dataproperties
        for (let datProp of jsonVal['dataproperties']) {
            node.children.push({name: datProp['translatedURL'], url: datProp['url'],
                color: 'green', children: []});
        }

        // adding objectproperties
        for (let objKey in jsonVal['objectproperties']) {
            if (jsonVal['objectproperties'].hasOwnProperty(objKey)) {
                // recursion..
                node.children.push(
                    this.parse_node(jsonVal['objectproperties'][objKey])
                );
            }
        }
        return {name: node.name, url: node.url, color: node.color, children: node.children};
    }
}
