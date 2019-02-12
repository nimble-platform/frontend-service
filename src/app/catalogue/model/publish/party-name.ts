import {Text} from './text';
import {createText} from '../../../common/utils';

export class PartyName {
    constructor(
        public name: Text = createText('')
    ) {  }
}
