
export class Server {
    public id: string;

    constructor(
        public priority: string,
        public name: string,
        public address: string,
        public duration: string,
        public ownership: string,
        public login: string,
        public loginPW: string,
        public description: string
    ) {  }
}
