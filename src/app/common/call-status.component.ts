/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import {
    Component, DoCheck, ElementRef, Input, OnInit, ViewChild
} from "@angular/core";
import {CallStatus} from "./call-status";

@Component({
    selector: 'call-status',
    templateUrl: './call-status.component.html',
    host: {
        '(document:click)': 'handleClick($event)',
    },
})

export class CallStatusComponent implements OnInit {
    @ViewChild('errorBox') errorBox: ElementRef;
    @ViewChild('successBox') successBox: ElementRef;

    // if true opens the detailed error messages by default
    @Input() showAllDetails:boolean = false;
    @Input() callStatus:CallStatus;
    // if true adds the alert class to the component for top and bottom padding
    @Input() large:boolean;
    showDetails: boolean[] = [];

    ngOnInit(): void {
        if (this.callStatus.aggregatedErrors) {
            for (let error of this.callStatus.aggregatedErrors) {
                this.showDetails.push(false);
            }
        }
    }

    isLoadingIconHidden(): boolean {
        return this.callStatus.callCount === 0 || this.callStatus.isAllComplete();
    }

    handleClick(event){
        // if the call is still active, ignore click
        if(this.callStatus.fb_submitted == true) {
            return;
        }

        var clickedComponent = event.target;
        var inside = false;
        do {
            // null check on the element refs in case they might not be rendered at all
            if ((this.errorBox != null && clickedComponent === this.errorBox.nativeElement) ||
                (this.successBox != null && clickedComponent === this.successBox.nativeElement)) {
                inside = true;
                break;
            }
            clickedComponent = clickedComponent.parentNode;
        } while (clickedComponent);

        // if successful and outside the box, reset the status
        /*if(!inside && this.callStatus.fb_callback == true) {
            this.callStatus.reset();
        }
        if(!inside && this.callStatus.fb_errordetc == true) {
            //this.callStatus.reset();
        }*/
    }
}
