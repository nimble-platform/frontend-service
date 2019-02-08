import {DEFAULT_LANGUAGE} from '../constants';

export class Text {
    constructor(
        public value: string = null,
        public languageID: string = DEFAULT_LANGUAGE()
    ) {  }
}