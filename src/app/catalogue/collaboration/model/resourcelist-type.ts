

export class ResourceListType {
    constructor(
        public token: string = "",
		public projectName: string = "",
		public name: string = "",
		public type: string = "",
		public version: number = 0,
		public user: string = "",
		public notes: string = "",
        public children: ResourceListType[] = []
    ) {  }
}
