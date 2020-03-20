import {Directive, HostListener} from '@angular/core';

/**
 * This directive is used to prevent multiple clicks on elements.
 * It will either disable the element or set pointer-events property of the element to none to prevent all clicks.
 * */
@Directive({
    selector: '[singleClick]'
})
export class SingleClickDirective {

    constructor() { }

    @HostListener('click',['$event'])
    clickEvent(event) {
        // get the element
        const button = (event.srcElement.disabled === undefined) ? event.srcElement.parentElement : event.srcElement;
        // if it does not have disabled property, set pointerEvents to none,
        // otherwise, set disabled attribute to true
        if(button.disabled === undefined){
            button.style.pointerEvents = 'none';
        }
        else{
            button.setAttribute('disabled', true);
        }
    }
}
