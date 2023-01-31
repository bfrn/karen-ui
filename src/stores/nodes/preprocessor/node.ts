export enum NodeTypes {
    Module = "Module",
    Resource = "Resource",
    ReferenceResource = "ReferenceResource",
    Provider = "Provider",
}

export class Node {
    public address!: String
    public nodeType!: NodeTypes
    public location!: String | undefined
    public children!: String[] | undefined
    public attributes!: Map<String, String> | undefined
}