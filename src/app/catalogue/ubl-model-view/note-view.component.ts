import {Component, Input} from '@angular/core';

@Component({
    selector: 'note-view',
    templateUrl: './note-view.component.html'
})
export class NoteViewComponent{

    @Input() notes:string[];
    @Input() readonly:boolean = true;

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