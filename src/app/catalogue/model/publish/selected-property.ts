import { Property } from "../category/property";
import { Category } from "../category/category";

export interface SelectedProperty {
    properties: Property[];
    categories: Category[];
    selected: boolean;
    lunrSearchId: string;
    key: string; // the ref for lunr

    // from Property, used for the lunr search
    preferredName: string;
    shortName: string;
}