import {Component, Input} from "@angular/core";
import {Clause} from "../../../catalogue/model/publish/clause";
@Component({
    selector: 'clause',
    templateUrl: './clause.component.html'
})
export class ClauseComponent {
    @Input() clause: Clause = null;
    @Input() presentationMode: string = 'view';

    visible: boolean = false;

    toggleVisible(): void {
        this.visible = !this.visible;
        console.log("visible:" + this.visible)
    }
}
