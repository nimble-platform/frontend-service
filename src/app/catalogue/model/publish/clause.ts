import {Text} from './text';

export class Clause {
    constructor(
        public id:string = null,
        public type:string = null,
        public content:Text[] = []
    ) {  }
}