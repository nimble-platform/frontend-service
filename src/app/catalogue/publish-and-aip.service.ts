import {Injectable, ViewChildren} from '@angular/core';
import {ItemProperty} from './model/publish/item-property';
import {ProductPropertiesComponent} from "./product-properties.component";
import { Subject } from 'rxjs/Subject';

@Injectable()
export class PublishAndAIPCService {
    @ViewChildren('productProperties') productProperties: ProductPropertiesComponent;

    private componentMethodCallSource = new Subject<any>();

    componentMethodCalled$ = this.componentMethodCallSource.asObservable();

    deleteProperty(inputVal: string) {
        this.componentMethodCallSource.next(inputVal);
    }
}