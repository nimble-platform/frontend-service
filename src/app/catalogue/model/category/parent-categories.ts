import { Category } from "./category";

export interface ParentCategories {
    /**
     * Parent categories for a specific category. Parents are the four ETC
     */
    parents: Category[];
    categories: Category[][];
}