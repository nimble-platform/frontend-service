import { AppComponent } from '../../app.component';
import { CookieService } from 'ng2-cookies';
import { SearchService } from '../search.service';
import { Component, OnInit } from '@angular/core';

@Component( {
    providers: [SearchService],
    selector: 'hello-world',
    template: '<h1>Hello {{name}}!</h1> <input width ="80%" #box      (keyup.enter)="update(box.value)"      (blur)="update(box.value)"> <button (click)="onClickMe()">Click me!</button> '
} )
export class HelloWorldComponent implements OnInit {
    private name = "World";

    clickMessage = '';
	private value = '';

    constructor( private searchService : SearchService ){ }
    ngOnInit(){
        this.name += this.searchService.testConnection();
    }

    update( value: string ) { this.value = value; }

    onClickMe() {
        console.log("Lala", null);
        this.name = ', you are my hero: !' + this.value +this.searchService.testConnection();

        for ( var i = 0; i < 10; i++ ) {
            this.name = this.name + i;
        }
    }

    createRange(  number:Number ){
        var items: number[] = [];
        for ( var i = 1; i <= number; i++ ) {
            items.push( i );
        }
        return items;
    }
}