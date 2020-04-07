/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

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
