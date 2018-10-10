/**
 * Created by suat on 23-Aug-17.
 */
/**
 * Created by suat on 23-Aug-17.
 */
export class ProcessVariables {
    constructor(public processID: string,
                public initiatorID: string,
                public responderID: string,
                public contentUUID: string,
                public creatorUserID: string,
                public relatedProducts: string[],
                public relatedProductCategories: string[],
                public content: string) {
    }
}