import { Property } from "../category/property";
import { Category } from "../category/category";
import {Text} from './text';

export interface SelectedProperty {
    properties: Property[];
    categories: Category[];
    selected: boolean;
    lunrSearchId: string;
    key: string; // the ref for lunr

    // from Property, used for the lunr search
    preferredName: Text[],
    shortName: string;
}