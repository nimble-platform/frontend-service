import * as _ from 'underscore';

declare var jQuery: any;
declare var Diagram: any;

export class ExternalDiagram {

    constructor() {

    }

    draw_editable_diagram(): void {
        let editor = jQuery('#editor');
        editor.on('change', _.debounce(on_change, 100));

        on_change();

        function on_change() {
            let diagram_div = jQuery('#diagram');
            let diagram = Diagram.parse(editor.val());
            // Clear out old diagram
            diagram_div.html('');
            // Draw
            diagram.drawSVG(diagram_div.get(0));
        }
    }

    draw_static_diagram(text_content: string): void {
        let diagram_div = jQuery('#diagram');
        let diagram = Diagram.parse(text_content);

        diagram.drawSVG(diagram_div.get(0));
    }
}
