import {Machine} from "./machine";

export class Sensor {

    public id: string;

    constructor(
        public name: string,
        public interval: string,
        public filter: string,
        public description: string,
        public machine: Machine
    ) {  }
}
