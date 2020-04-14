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

import { Directive, HostListener } from '@angular/core';

/**
 * This directive is used to prevent multiple clicks on elements.
 * It will either disable the element or set pointer-events property of the element to none to prevent all clicks.
 * */
@Directive({
    selector: '[singleClick]'
})
export class SingleClickDirective {

    constructor() { }

    @HostListener('click', ['$event'])
    clickEvent(event) {
        // get the element
        const button = (event.srcElement.disabled === undefined) ? event.srcElement.parentElement : event.srcElement;
        // if it does not have disabled property, set pointerEvents to none,
        // otherwise, set disabled attribute to true
        if (button.disabled === undefined) {
            button.style.pointerEvents = 'none';
        }
        else {
            button.setAttribute('disabled', true);
        }
    }
}
