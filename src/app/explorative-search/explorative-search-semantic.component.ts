import {Component} from '@angular/core';

@Component({
    selector: 'explore-search-semantic',
    template: `<div><p>This is {{testVar}} stuff!!</p></div>`,
})

export class ExplorativeSearchSemanticComponent {
    private testVar = 'Semantic Query';
}