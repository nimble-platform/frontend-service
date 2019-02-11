import {CatalogueLine} from './catalogue-line';

export class CataloguePaginationResponse {
    constructor(
        public catalogueUuid:string = null, // uuid of the catalogue
        public size: number = null, // the number of catalogue lines which the catalogue contains
        public catalogueLines: CatalogueLine[] = null // catalogue lines of the catalogue
    ) {  }
}