/**
 * Created by deniz on 16/07/17.
 */

export class ExternalReference {
    constructor(
        public uri: string,
        public fileName: string,
        public description: string
        // TODO left hjid out?
    ) {  }
}