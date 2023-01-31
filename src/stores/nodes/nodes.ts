import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import { NodeTypes, Node, Module, Resource, ResourceStates, ReferenceResource, Provider } from './preprocessor'
import { invoke } from "@tauri-apps/api/tauri";


const nodesStoreState = writable(new Map<string, Map<string, Node>>());
var nodeTables: Map<string, Map<string, Node>>
nodesStoreState.subscribe(nodeStoreTables => nodeTables = nodeStoreTables)

const selectedNodeTableState = writable("")
var selectedNodeTable: string
selectedNodeTableState.subscribe(state => selectedNodeTable = state)

function getNode(nodeTableName: string, nodeAddress: string) {
    const nodeTable = nodeTables.get(nodeTableName)
    if (nodeTable !== undefined) {
        const node = nodeTable.get(nodeAddress)
        if (node !== undefined) {
            return node
        } else {
            throw new Error(`A node with the given address ${nodeAddress} is not present`)
        }
    } else {
        throw new Error(`A nodeTable with the given name ${nodeTableName} is not present`)
    }
}

function getNodes(nodeTableName: string, nodeAddresses: string[]) {
    const nodeTable = nodeTables.get(nodeTableName)
    if (nodeTable !== undefined) {
        var nodes: Node[] = []
        nodeAddresses.forEach(address => {
            var node = nodeTable.get(address)
            if (node !== undefined) {
                nodes.push(node)
            }
        })
        return nodes
    } else {
        throw new Error(`A nodeTable with the given name ${nodeTableName} is not present`)
    }
}

function getResoruceByStateAttribute(nodeTableName: string, stateName: ResourceStates, attributeName: string, expectedAttributeValue: string) {
    const nodeTable = nodeTables.get(nodeTableName)
    if (nodeTable !== undefined) {
        for (let node of nodeTable.values()) {
            if (node instanceof Resource) {
                const resource = node as Resource
                const state = resource.states.get(stateName)
                if (state !== undefined) {
                    const unparsedAttributeValue = state.get(attributeName)
                    if (typeof unparsedAttributeValue === 'string') {
                        const parsedAttributeValue = unparsedAttributeValue as String
                        if (parsedAttributeValue === expectedAttributeValue) {
                            return resource
                        }
                    }
                }
            }
        }
        return undefined
    } else {
        throw new Error(`A nodeTable with the given name ${nodeTableName} is not present`)
    }
}

function getNodesByResourceType(nodeTableName: string, resourceType: string) {
    const nodeTable = nodeTables.get(nodeTableName)
    const resources: Resource[] = []
    if (nodeTable !== undefined) {
        for (let node of nodeTable.values()) {
            const splittedNodeAddress = node.address.split('.')
            const currentResourceType = splittedNodeAddress[splittedNodeAddress.length - 2]
            if (currentResourceType === resourceType) {
                if (node instanceof Resource) {
                    const resource = node as Resource
                    resources.push(resource)
                } if (node instanceof ReferenceResource) {
                    const referenceResource = node as ReferenceResource
                    //TODO: deal with the reference resource case
                }
            }
        }
    } else {
        throw new Error(`A nodeTable with the given name ${nodeTableName} is not present`)
    }
    return resources;
}

function getDependentNodes(nodeTableName: string, nodeAddress: string) {
    const nodeTable = nodeTables.get(nodeTableName)
    if (nodeTable !== undefined) {
        var dependentNodes: string[] = []
        var node = nodeTable.get(nodeAddress)
        if (node !== undefined) {
            if (node.nodeType === NodeTypes.Resource || node.nodeType === NodeTypes.ReferenceResource) {
                var resource = node as Resource
                if (resource.dependencies !== undefined) {
                    resource.dependencies.forEach(dependency => {
                        dependentNodes.push(dependency as string)
                    })
                }
            }
        }
        return dependentNodes
    } else {
        throw new Error(`A nodeTable with the given name ${nodeTableName} is not present`)
    }
}


export async function saveFile(namespace: string, text: string): Promise<boolean> {
    const jsonString = text.trim()
    var nodes = JSON.parse(jsonString)

    for (let key in nodes) {
        const node = nodes[key]
        const stringifiedNode = JSON.stringify(node)
        try {
            await invoke('set_value', { namespace: namespace, key: key, node: stringifiedNode });
        } catch (error) {
            console.error(error)
        }
    }
    return true
}

async function fetchNodes(namespace: string) {
    const rawNodes = await invoke("get_values", { namespace: namespace })

    if (isStringArray(rawNodes)) {
        const nodeTables = new Map<string, Map<string, Node>>()
        const nodeMap = rawNodes
            .map(rawNode => deserializeNode(rawNode))
            .reduce((acc, node) => {
                acc.set(node.address as string, node)
                return acc
            }, new Map<string, Node>)
        nodeTables.set(namespace, nodeMap)
        nodeStore.nodesStore.set(nodeTables)
    } else {
        throw Error(`The data retrived from the backend is of type ${typeof rawNodes} instead of string[]`)
    }

}

export async function fetchNamespaces() {
    const namespaces = await invoke("list_namespaces")
    if (isStringArray(namespaces)) {
        return namespaces
            .filter(namespace => namespace !== "default")
    } else {
        throw Error(`The data retrived from the backend is of type ${typeof namespaces} instead of string[]`)
    }
}

export async function dropNamespace(namespace: string) {
    try {
        await invoke("drop_namespace", { namespace: namespace })
    }
    catch (error) {
        throw Error(`${error}`)
    }
}

function deserializeNode(nodeJsonString: string): Node {
    const node = JSON.parse(nodeJsonString)
    let parsedNode: Node;
    switch (node.nodeType) {
        case NodeTypes.Module: {
            parsedNode = Module.fromJson(node)
            break;
        }
        case NodeTypes.Resource: {
            parsedNode = Resource.fromJson(node)
            break
        }
        case NodeTypes.ReferenceResource: {
            parsedNode = ReferenceResource.fromJson(node)
            break
        }
        case NodeTypes.Provider: {
            parsedNode = Provider.fromJson(node)
            break
        }
        default: {
            throw Error(`Could not cast node of type ${node.nodeType}`)
        }
    }
    return parsedNode;
}

function isStringArray(value: unknown): value is string[] {
    return (
        Array.isArray(value) && value.every(elem => typeof elem === "string")
    )
}

function getSelectedNodeTable() {
    return selectedNodeTable
}

function setSelectedNodeTable(newSelectedNodeTable: string) {
    nodeStore.selectedNodeTable.set(newSelectedNodeTable)
}

export class NodeStore {
    public nodesStore: Writable<Map<string, Map<string, Node>>>
    public selectedNodeTable: Writable<string>
    public getters: NodesStoreGetters
    public actions: NodesStoreActions

    constructor(nodesStoreState: Writable<Map<string, Map<string, Node>>>, selectedNodeTable: Writable<string>) {
        this.nodesStore = nodesStoreState
        this.selectedNodeTable = selectedNodeTable
        this.getters = {
            getNode,
            getNodes,
            getResoruceByStateAttribute,
            getNodesByResourceType,
            getDependentNodes,
            getSelectedNodeTable,
        }
        this.actions = {
            fetchNodes,
            setSelectedNodeTable,
        }
    }
}

export interface NodesStoreGetters {
    getNode: (nodeTableName: string, nodeAddress: string) => Node
    getNodes: (nodeTableName: string, nodeAddresses: string[]) => Node[]
    getResoruceByStateAttribute: (nodeTableName: string, stateName: ResourceStates, attributeName: string, expectedAttributeValue: string) => Resource | undefined
    getNodesByResourceType: (nodeTableName: string, resourceType: string) => Resource[]
    getDependentNodes: (nodeTableName: string, nodeAddress: string) => string[]
    getSelectedNodeTable(): string
}

export interface NodesStoreActions {
    fetchNodes(namespace: string): Promise<void>
    setSelectedNodeTable(newSelectedNodeTable: string): void
}

export const nodeStore = new NodeStore(nodesStoreState, selectedNodeTableState)
