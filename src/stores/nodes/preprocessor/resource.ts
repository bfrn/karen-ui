import { Node, NodeTypes } from './node'

export enum ResourceStates {
    CurrentState = "Current_State",
    PlannedState = "Planned_State",
}

export class Resource extends Node {
    public dependencies: String[] | undefined
    public actions: String[] | undefined
    public states: Map<String, Map<String, any>>

    constructor(
        address: String,
        nodeType: NodeTypes,
        states: Map<String, Map<String, any>>,
        location?: String,
        children?: String[],
        attributes?: Map<String, any>,
        dependencies?: String[],
        actions?: String[],
    ) {
        super()
        this.address = address
        this.nodeType = nodeType
        this.location = location
        this.children = children
        this.attributes = attributes
        this.dependencies = dependencies
        this.actions = actions
        this.states = states
    }

    static fromJson(json: any): Resource {
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

        var actions: String[] | undefined
        if (json.actions !== undefined) {
            actions = json.actions
        }

        const states = new Map<String, Map<String, any>>()
        if (json.states !== undefined) {
            Object.entries(json.states).map((value) => {
                states.set(
                    value[0],
                    new Map(Object.entries(value[1] as [string, any]))

                )
            })
        }

        return new Resource(
            address,
            nodeType,
            states,
            location,
            children,
            attributes,
            dependencies,
            actions
        )
    }
}