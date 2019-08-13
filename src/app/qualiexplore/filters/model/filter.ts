export interface Label {
    id: number;
    name: string;
    checked: boolean;
};

export interface Filter {
    name: string;
    labels: Label[];
};
