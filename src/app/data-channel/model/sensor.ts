import {Machine} from "./machine";

export class Sensor {

    public id: string;

    constructor(
        public name: string,
        public interval: number,
        public description: string,
        public dataKey: string,
        public metadata: string,
        public advancedFiltering: string,
        public machine: Machine
    ) {  }
}
