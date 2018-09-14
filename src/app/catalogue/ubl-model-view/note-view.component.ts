import {Component, Input} from '@angular/core';

@Component({
    selector: 'note-view',
    templateUrl: './note-view.component.html'
})
export class NoteViewComponent{

    @Input() notes:string[];
    @Input() requestNotes:string[]; // special case for negotiation response
    @Input() readonly:boolean = true;
    @Input() label:string;

    @Input() firstCol:string = "col-3";
    @Input() secondCol:string = null; // negotiation request
    @Input() thirdCol:string = null; // special case for negotiation response
    @Input() lastCol:string = "col-9";

    onRemoveNote(index){
        this.notes.splice(index,1);
    }

    onAddNote(){
        this.notes.push("");
    }

    setNote(index,event){
        this.notes[index] = event.target.value;
    }

}