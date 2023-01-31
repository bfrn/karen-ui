import { Node, NodeTypes } from './node'

export class Module extends Node {
    constructor(
        address: String,
        nodeType: NodeTypes,
        location?: String,
        children?: String[],
        attributes?: Map<String, any>,
    ) {
        super()
        this.address = address
        this.nodeType = nodeType
        this.location = location
        this.children = children
        this.attributes = attributes
    }

    static fromJson(json: any): Module {
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

        return new Module(address, nodeType, location, children, attributes)
    }
}
