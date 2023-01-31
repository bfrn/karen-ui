import { Node, NodeTypes } from "./node"

export class ReferenceResource extends Node {
    public dependencies: String[] | undefined

    constructor(
        address: String,
        nodeType: NodeTypes,
        location?: String,
        children?: String[],
        attributes?: Map<String, any>,
        dependencies?: String[],
    ) {
        super()
        this.address = address
        this.nodeType = nodeType
        this.location = location
        this.children = children
        this.attributes = attributes
        this.dependencies = dependencies
    }

    static fromJson(json: any): ReferenceResource {
        const address = String(json.address)
        const nodeType = json.nodeType as NodeTypes.Module

        var location: String | undefined
        if (json.location !== undefined) {
            location = String(json.location)
        }

        var children: String[] | undefined
        if (json.location !== undefined) {
            children = json.children
        }

        var attributes: Map<String, any> | undefined
        if (json.attributes !== undefined) {
            attributes = new Map<String, any>(Object.entries(json.attributes))
        }

        var dependencies: String[] | undefined
        if (json.dependencies !== undefined) {
            dependencies = json.dependencies
        }

        return new ReferenceResource(address, nodeType, location, children, attributes, dependencies)
    }
}
