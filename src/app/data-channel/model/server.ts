
export class Server {
    public id: string;

    constructor(
        public priority: string,
        public name: string,
        public address: string,
        public duration: string,
        public ownership: string,
        public description: string
    ) {  }
}
