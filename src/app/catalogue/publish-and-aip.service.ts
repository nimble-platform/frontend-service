import {Injectable} from '@angular/core';
import {ItemProperty} from './model/publish/item-property';

@Injectable()
export class PublishAndAIPCService {
    customProperties: ItemProperty[] = [];

    baseProperties: ItemProperty[] = [];
    specificProperties: ItemProperty[] = [];

    deletedProperties: string[] = [];

    insertCustom(data: ItemProperty) {
        this.customProperties.push(data);
    }
    insertBase(data: ItemProperty) {
        this.baseProperties.push(data);
    }
    insertSpecific(data: ItemProperty) {
        this.specificProperties.push(data);
    }

    addToDeletedProperties(inputVal: string) {
        // find the matching keyword in the List Output

        const index1 = this.customProperties.findIndex(op => op.name === inputVal);
        const index2 = this.baseProperties.findIndex(op => op.name === inputVal);
        const index3 = this.specificProperties.findIndex(op => op.name === inputVal);

        if (index1 > -1) {
            // remove the whole entry from the list
            this.customProperties.splice(index1, 1);

        }
        else if (index2 > -1) {
            // remove the whole entry from the list
            this.baseProperties.splice(index2, 1);

        }
        else if (index3 > -1) {
            // remove the whole entry from the list
            this.specificProperties.splice(index3, 1);

        }

        this.deletedProperties.push(inputVal);
    }

    removeFromDeleted(inputVal: string) {
        let index = this.deletedProperties.indexOf(inputVal);
        this.deletedProperties.splice(index, 1);
    }

    resetService() {
        this.customProperties = [];
        this.baseProperties = [];
        this.specificProperties = [];
        this.deletedProperties = [];
    }
}