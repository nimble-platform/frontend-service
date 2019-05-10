/**
 * Created by suat on 12-May-17.
 */
import {Unit} from "./unit";
import {KeywordSynonym} from "./keyword-synonym";
import {Value} from "./value";
import { PropertyValueQualifier } from "../publish/property-value-qualifier";
import {Text} from '../publish/text';

export class Property {
    constructor(
        public id: string,
        public preferredName: Text[] = [],
        public shortName: string,
        public definition: string,
        public note: string,
        public remark: Text[] = [],
        public preferredSymbol: string,
        public unit: Unit,
        public iecCategory: string,
        public attributeType: string,
        public dataType: PropertyValueQualifier,
        public synonyms: KeywordSynonym[],
        public values: Value[],
        public uri: string
    ) {  }
}