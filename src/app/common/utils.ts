const UI_NAMES: any = {
    STRING: "TEXT"
}

export function toUIString(dataType: string): string {
    if(UI_NAMES[dataType]) {
        return UI_NAMES[dataType]
    }
    return dataType;
}