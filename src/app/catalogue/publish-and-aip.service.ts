import {Injectable, ViewChildren} from '@angular/core';
import {ItemProperty} from './model/publish/item-property';
import {ProductPropertiesComponent} from "./product-properties.component";
import { Subject } from 'rxjs/Subject';

@Injectable()
export class PublishService {
    propertyBlockCollapsedStates:Map<string, boolean> = new Map<string, boolean>();

    getCollapsedStates():any {
        return this.propertyBlockCollapsedStates;
    }

    getCollapsedState(blockName:string):boolean {
        if(this.propertyBlockCollapsedStates.has(blockName)) {
            return this.propertyBlockCollapsedStates.get(blockName);
        } else {
            this.propertyBlockCollapsedStates.set(blockName, true);
            return true;
        }
    }

    resetData():void {
        this.propertyBlockCollapsedStates = new Map<string, boolean>();
    }
}