
/**
 * This utility class helps to convert between 2 different representations for the same information:
 *  - an array of string that represents the selected terms (in order)
 *  - a map of term -> boolean that represents which term is selected
 */
export class SelectedTerms {

    // the map term -> boolean of selected terms
    private selectedMap: any = {};

    constructor(public selectedTerms: string[], 
                public allTerms: string[]) {
        if(selectedTerms.length > 0) {
            selectedTerms.forEach(term => {
                this.selectedMap[term] = true
            })
        } else {
            allTerms.forEach(term => {
                this.selectedMap[term] = true
            })
            selectedTerms.push(...allTerms);
        }
    }


    isSelected(term: string): boolean {
        return this.selectedMap[term] || term == "";
    }

    toggle(term: string) {
        this.selectedMap[term] = !this.selectedMap[term];
        // empty the array
        this.selectedTerms.splice(0, this.selectedTerms.length);
        // re-add the selected terms. This is done this way to make sure the order of
        // selectedTerms is preserved.
        this.allTerms.forEach(existing => {
            if(this.isSelected(existing)) {
                this.selectedTerms.push(existing);
            }
        });
    }
}