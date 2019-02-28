/**
 * Created by deniz on 16/07/17.
 */
import {Text} from "./text";
import {DEFAULT_LANGUAGE} from '../constants';

export class Country {
    constructor(
        public name: Text = new Text(null,DEFAULT_LANGUAGE())
    ) {  }
}
