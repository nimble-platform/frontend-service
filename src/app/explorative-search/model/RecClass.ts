/**
 * class OntNode
 * A Node structure for Binary Tree of the complete Data obtained from server
 */
export class OntNode {
    public id: number; // ID of the node
    public attr: any[] = []; // Array of all attributes connected to the node
    public children: OntNode[] = []; // Check for Nodes with Children
}

export class RecursionParse {

    public nodes: any[] = [];
    private links: any[] = [];


    public parse_ontology(ont: any): any {

        let linkedOntTree = this.parse_node(ont.viewStructure);
        this.links = this.parse_link(linkedOntTree);
        // console.log({'nodes': this.nodes, 'links': this.links});
        return {'nodes': this.nodes, 'links': this.links}

    }


    public parse_node(jsonVal: any): any {
        let node = new OntNode();
        node.id = this.nodes.length;
        this.nodes.push({
            name: jsonVal['concept']['translatedURL'],
            url: jsonVal['concept']['url'],
            conceptSource: jsonVal['concept']['conceptSource'],
            id: this.nodes.length,
            color: 'red'
        });


        // adding dataproperties
        for (let datProp of jsonVal.dataproperties) {
            this.nodes.push({
                name: datProp['translatedURL'],
                url: datProp['url'],
                id: this.nodes.length,
                conceptSource: datProp['conceptSource'],
                propertySource: datProp['propertySource'],
                color: 'green'
            });
            node.attr.push(this.nodes.length);
        }

        // adding objectproperties
        for (let objKey in jsonVal.objectproperties) {
            if (jsonVal.objectproperties.hasOwnProperty(objKey)) {
                // recursion..
                node.children.push(
                    this.parse_node(jsonVal['objectproperties'][objKey])
                );
            }
        }
        return node;
    }

    private parse_link(linkedOntTree: any): any {
        let links: any[] = [];

        for (let attr of linkedOntTree.attr) {
            links.push({
                source: linkedOntTree.id,
                target: attr
            });
        }

        for (let child of linkedOntTree.children) {
            links.push({
                source: linkedOntTree.id,
                target: child.id
            });

            let childJSON = this.parse_link(child);

            childJSON.forEach(element => links.push(element));
        }

        return links;
    }
}
