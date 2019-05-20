import {CanDeactivate} from "@angular/router";
import {Injectable} from "@angular/core";
import {LogisticServicePublishComponent} from './publish/logistic-service-publish.component';

@Injectable()
export class LogisticPublishDeactivateGuardService implements CanDeactivate<LogisticServicePublishComponent> {

    canDeactivate(component: LogisticServicePublishComponent): boolean {
        return component.canDeactivate();
    }
}