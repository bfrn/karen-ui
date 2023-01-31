class Node {
    id: string
    idx: number | undefined
    lowlink: number | undefined
    onStack: boolean
    constructor(id: string) {
        this.id = id
        this.onStack = false
    }
}

export class NodeTable {
    private edgeMap: Map<string, string[]>
    private tarjanNodes: Map<string, Node>
    private selectedNodes: string[]

    constructor(tarjanNodes: Map<string, Node>, edgeMap: Map<string, string[]>, selectedNodes: string[]) {
        this.edgeMap = edgeMap
        this.tarjanNodes = tarjanNodes
        this.selectedNodes = selectedNodes
    }

    getSuccessor(nodeId: string): Node[] {
        const successors = this.edgeMap.get(nodeId) || []
        return successors
            .map(successor => this.tarjanNodes.get(successor))
            .filter((node): node is Node => !!node)
    }

    getSelectedNodes(): Node[] {
        if (this.selectedNodes.length === 0) {
            return [...this.tarjanNodes.values()]
        } else {
            return this.selectedNodes
                .map(selectedNode => this.tarjanNodes.get(selectedNode))
                .filter((node): node is Node => !!node)
        }
    }

}

export function tarjan(nodes: string[], edges: string[], nodeSeperator: string, selectedNodes: string[]): string[][] {

    const tarjanNodes = nodes
        .map(nodeId => new Node(nodeId))
        .reduce((acc, node) => {
            acc.set(node.id, node)
            return acc
        }, new Map<string, Node>)


    const edgeMap = edges
        .reduce((acc, edge) => {
            const splittedEdge = edge.split(nodeSeperator)
            const sourceNode = splittedEdge[0]
            const targetNode = splittedEdge[1]
            if (acc.has(sourceNode)) {
                acc.get(sourceNode)?.push(targetNode)
            } else {
                acc.set(sourceNode, [targetNode])
            }
            return acc
        }, new Map<string, string[]>)
    var idx = 0
    const stack: Node[] = []
    const nodeTable = new NodeTable(tarjanNodes, edgeMap, selectedNodes)
    const sccs: string[][] = []

    for (let node of nodeTable.getSelectedNodes()) {
        if (node.idx === undefined) {
            strongconnect(node, idx, stack, nodeTable, sccs)
        }
    }
    let filteredSccs = sccs.filter(scc => scc.length > 1)
    let sccsWithEdges: string[][] = []
    for (const [_, scc] of filteredSccs.entries()) {
        const sccWithEdges = new Set<string>()
        for (let node of scc) {
            sccWithEdges.add(node)
        }
        for (let edge of edges) {
            let splittedEdge = edge.split(nodeSeperator)
            let startNode = splittedEdge[0]
            let targetNode = splittedEdge[1]
            if (sccWithEdges.has(startNode) && sccWithEdges.has(targetNode)) {
                sccWithEdges.add(edge)
            }
        }
        sccsWithEdges.push(Array.from(sccWithEdges))
    }
    return sccsWithEdges

}

function strongconnect(node: Node, previousIdx: number, stack: Node[], nodeTable: NodeTable, sccs: string[][]) {
    let idx = previousIdx
    node.idx = idx
    node.lowlink = idx
    idx++

    stack.push(node)
    node.onStack = true

    const successors = nodeTable.getSuccessor(node.id)
    for (let successor of successors) {
        if (successor.idx === undefined) {
            strongconnect(successor, idx, stack, nodeTable, sccs)
            node.lowlink = getMinLowlink(node, successor)
        } else if (successor.onStack) {
            node.lowlink = getMinLowlink(node, successor)
        }
    }
    if (node.lowlink === node.idx) {
        const scc: string[] = []
        var sccNode: Node
        do {
            const currSccNode = stack.pop()
            if (currSccNode !== undefined) {
                sccNode = currSccNode
                sccNode.onStack = false
                scc.push(sccNode.id)
            } else {
                throw new Error(`No nodes are present on the stack`)
            }
        } while (sccNode.id !== node.id)
        sccs.push(scc)
    }
}

function getMinLowlink(node: Node, successor: Node): number {
    if (successor.lowlink !== undefined && node.lowlink !== undefined) {
        return node.lowlink <= successor.lowlink ? node.lowlink : successor.lowlink
    } else {
        const nodeId = node.lowlink === undefined ? node.id : successor.id
        throw new Error(`The lowlink value of successor ${nodeId} is undefiened`)
    }
}